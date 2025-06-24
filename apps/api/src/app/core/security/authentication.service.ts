import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: any;
  requiresMFA?: boolean;
  mfaSecret?: string;
  qrCode?: string;
}

export interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
}

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private loginAttempts = new Map<string, LoginAttempt[]>();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      // Simulate user lookup
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.isLocked && new Date() < user.lockoutUntil) {
        throw new UnauthorizedException('Account is temporarily locked');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        await this.recordFailedLogin(email, 'Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Clear failed login attempts on successful password validation
      await this.clearFailedLogins(email);

      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Authentication failed for ${email}:`, error);
      throw error;
    }
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string): Promise<AuthResult> {
    // Check if account is locked
    await this.checkAccountLockout(email);

    const user = await this.validateUser(email, password);

    // Record successful login
    await this.recordSuccessfulLogin(email, ipAddress, userAgent);

    // Check if MFA is required
    if (user.mfaEnabled) {
      // Generate temporary token for MFA verification
      const tempToken = await this.generateTempToken(user);
      return {
        accessToken: tempToken,
        refreshToken: '',
        user: this.sanitizeUser(user),
        requiresMFA: true
      };
    }

    // Generate full access tokens
    const tokens = await this.generateTokens(user);
    
    return {
      ...tokens,
      user: this.sanitizeUser(user)
    };
  }

  async verifyMFA(tempToken: string, mfaCode: string): Promise<AuthResult> {
    try {
      // Verify temporary token
      const payload = await this.jwtService.verifyAsync(tempToken);
      const user = await this.findUserById(payload.sub);

      if (!user || !user.mfaEnabled) {
        throw new UnauthorizedException('Invalid MFA verification');
      }

      // Verify MFA code
      const isValidMFA = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (!isValidMFA) {
        throw new UnauthorizedException('Invalid MFA code');
      }

      // Generate full access tokens
      const tokens = await this.generateTokens(user);
      
      return {
        ...tokens,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      this.logger.error('MFA verification failed:', error);
      throw new UnauthorizedException('Invalid MFA verification');
    }
  }

  async setupMFA(userId: string): Promise<MFASetupResult> {
    const user = await this.findUserById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `Beyond the AI Plateau (${user.email})`,
      issuer: 'amysoft.tech'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret temporarily (user must verify before enabling)
    await this.storeTempMFASecret(userId, secret.base32, backupCodes);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    };
  }

  async confirmMFASetup(userId: string, mfaCode: string): Promise<boolean> {
    const tempData = await this.getTempMFASecret(userId);
    
    if (!tempData) {
      throw new UnauthorizedException('MFA setup not found');
    }

    // Verify the provided code
    const isValidMFA = speakeasy.totp.verify({
      secret: tempData.secret,
      encoding: 'base32',
      token: mfaCode,
      window: 2
    });

    if (!isValidMFA) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Enable MFA for user
    await this.enableMFAForUser(userId, tempData.secret, tempData.backupCodes);
    await this.clearTempMFASecret(userId);

    this.logger.log(`MFA enabled for user ${userId}`);
    return true;
  }

  async disableMFA(userId: string, password: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify password before disabling MFA
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.disableMFAForUser(userId);
    this.logger.log(`MFA disabled for user ${userId}`);
    
    return true;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')
      });

      const user = await this.findUserById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const accessToken = await this.jwtService.signAsync(
        { 
          sub: user.id, 
          email: user.email, 
          role: user.role,
          permissions: user.permissions 
        },
        { 
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m' 
        }
      );

      return { accessToken };
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<boolean> {
    try {
      // Invalidate refresh token
      await this.invalidateRefreshToken(refreshToken);
      
      // Log logout event
      this.logger.log(`User ${userId} logged out`);
      
      return true;
    } catch (error) {
      this.logger.error('Logout failed:', error);
      return false;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.updateUserPassword(userId, newPasswordHash);
    
    this.logger.log(`Password changed for user ${userId}`);
    return true;
  }

  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      permissions: user.permissions || []
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m'
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d'
      })
    ]);

    return { accessToken, refreshToken };
  }

  private async generateTempToken(user: any): Promise<string> {
    const payload = { sub: user.id, temp: true };
    
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '10m' // Short-lived for MFA verification
    });
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new UnauthorizedException(`Password validation failed: ${errors.join(', ')}`);
    }
  }

  private async checkAccountLockout(email: string): Promise<void> {
    const attempts = this.loginAttempts.get(email) || [];
    const recentFailures = attempts.filter(
      attempt => !attempt.success && 
      (Date.now() - attempt.timestamp.getTime()) < this.LOCKOUT_DURATION
    );

    if (recentFailures.length >= this.MAX_LOGIN_ATTEMPTS) {
      throw new UnauthorizedException('Account temporarily locked due to too many failed login attempts');
    }
  }

  private async recordFailedLogin(email: string, reason: string): Promise<void> {
    const attempts = this.loginAttempts.get(email) || [];
    attempts.push({
      email,
      ipAddress: '', // Would be populated from request
      userAgent: '', // Would be populated from request
      timestamp: new Date(),
      success: false,
      reason
    });

    this.loginAttempts.set(email, attempts);
  }

  private async recordSuccessfulLogin(email: string, ipAddress: string, userAgent: string): Promise<void> {
    const attempts = this.loginAttempts.get(email) || [];
    attempts.push({
      email,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success: true
    });

    this.loginAttempts.set(email, attempts);
  }

  private async clearFailedLogins(email: string): Promise<void> {
    this.loginAttempts.delete(email);
  }

  private sanitizeUser(user: any): any {
    const { passwordHash, mfaSecret, ...sanitized } = user;
    return sanitized;
  }

  // Placeholder methods for database operations
  private async findUserByEmail(email: string): Promise<any> {
    // Implementation would query actual database
    return null;
  }

  private async findUserById(id: string): Promise<any> {
    // Implementation would query actual database
    return null;
  }

  private async storeTempMFASecret(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    // Implementation would store in database or cache
  }

  private async getTempMFASecret(userId: string): Promise<any> {
    // Implementation would retrieve from database or cache
    return null;
  }

  private async clearTempMFASecret(userId: string): Promise<void> {
    // Implementation would clear from database or cache
  }

  private async enableMFAForUser(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    // Implementation would update user in database
  }

  private async disableMFAForUser(userId: string): Promise<void> {
    // Implementation would update user in database
  }

  private async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    // Implementation would update user in database
  }

  private async invalidateRefreshToken(refreshToken: string): Promise<void> {
    // Implementation would invalidate token in database/cache
  }
}