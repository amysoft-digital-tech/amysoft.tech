import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminPermission } from '../interfaces/admin.interfaces';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    try {
      const adminUser = await this.adminAuthService.verifyAdminToken(token);
      request.adminUser = adminUser;

      // Check required permissions
      const requiredPermissions = this.reflector.get<AdminPermission[]>(
        'permissions',
        context.getHandler(),
      );

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }

      const hasPermission = requiredPermissions.every(permission =>
        adminUser.permissions.includes(permission),
      );

      if (!hasPermission) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}