import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserActivity, ActivityType } from '../../entities/user-activity.entity';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, ipAddress?: string): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.STUDENT,
      status: UserStatus.PENDING_VERIFICATION,
    });

    const savedUser = await this.userRepository.save(user);

    // Log registration activity
    const activity = new UserActivity();
    activity.user = savedUser;
    activity.type = ActivityType.REGISTER;
    activity.description = 'User registered';
    activity.ipAddress = ipAddress;
    await this.activityRepository.save(activity);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account has been suspended');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account not found');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.updateLastLogin(ipAddress);
    await this.userRepository.save(user);

    // Log login activity
    const activity = UserActivity.createLoginActivity(user, ipAddress, userAgent);
    await this.activityRepository.save(activity);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      const activity = UserActivity.createLogoutActivity(user);
      await this.activityRepository.save(activity);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user && await user.validatePassword(password)) {
      return user;
    }

    return null;
  }

  async getUserFromPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: payload.sub },
      relations: ['subscription']
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account is not active');
    }

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = await user.generatePasswordResetToken();
    await this.userRepository.save(user);

    // Log password reset request
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.PASSWORD_RESET_REQUESTED;
    activity.description = 'Password reset requested';
    await this.activityRepository.save(activity);

    // In a real app, send email with reset token
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, email, newPassword } = resetPasswordDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordResetToken', 'user.passwordResetExpires'])
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    const isValidToken = await user.validatePasswordResetToken(token);
    if (!isValidToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.hashPassword();
    await this.userRepository.save(user);

    // Log password reset completion
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.PASSWORD_RESET_COMPLETED;
    activity.description = 'Password reset completed';
    await this.activityRepository.save(activity);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.hashPassword();
    await this.userRepository.save(user);

    // Log password change
    const activity = UserActivity.createPasswordChangeActivity(user);
    await this.activityRepository.save(activity);

    return { message: 'Password has been changed successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    // Log email verification
    const activity = new UserActivity();
    activity.user = user;
    activity.type = ActivityType.EMAIL_VERIFIED;
    activity.description = 'Email verified';
    await this.activityRepository.save(activity);

    return { message: 'Email has been verified successfully' };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '24h');

    return { accessToken, expiresIn: this.parseExpiresIn(expiresIn) };
  }

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const expiresIn = this.parseExpiresIn(this.configService.get('JWT_EXPIRES_IN', '24h'));

    return { accessToken, refreshToken, expiresIn };
  }

  private parseExpiresIn(expiresIn: string): number {
    // Convert JWT expiration string to seconds
    const matches = expiresIn.match(/(\d+)([smhd])/);
    if (!matches) return 86400; // default 24 hours

    const value = parseInt(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 86400;
    }
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, passwordResetToken, emailVerificationToken, ...sanitized } = user;
    return sanitized;
  }
}