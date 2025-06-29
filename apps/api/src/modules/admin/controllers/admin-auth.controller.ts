import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto, AdminTokenResponseDto } from '../dto/admin-auth.dto';

@ApiTags('Admin - Authentication')
@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AdminTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AdminLoginDto): Promise<AdminTokenResponseDto> {
    const adminUser = await this.adminAuthService.validateAdminUser(
      loginDto.email,
      loginDto.password,
    );

    if (!adminUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.adminAuthService.generateAdminToken(adminUser);

    return {
      accessToken,
      expiresIn: 28800, // 8 hours in seconds
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions,
      },
    };
  }
}