import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../entities/user.entity';
import { AdminUser, AdminRole, AdminPermission } from '../interfaces/admin.interfaces';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdminUser(email: string, password: string): Promise<AdminUser | null> {
    const user = await this.userRepository.findOne({
      where: { email, isAdmin: true },
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return null;
    }

    return this.mapUserToAdminUser(user);
  }

  async generateAdminToken(adminUser: AdminUser): Promise<string> {
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions,
      type: 'admin',
    };

    return this.jwtService.sign(payload);
  }

  async verifyAdminToken(token: string): Promise<AdminUser> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'admin') {
        throw new UnauthorizedException('Invalid admin token');
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        lastLogin: new Date(),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private mapUserToAdminUser(user: User): AdminUser {
    // Map user admin role to permissions
    const role = this.getUserAdminRole(user);
    const permissions = this.getRolePermissions(role);

    return {
      id: user.id,
      email: user.email,
      role,
      permissions,
      lastLogin: user.lastLogin || new Date(),
    };
  }

  private getUserAdminRole(user: User): AdminRole {
    // In a real implementation, this would come from a separate admin_users table
    // For now, we'll use a simple mapping based on user properties
    if (user.email.includes('super')) {
      return AdminRole.SUPER_ADMIN;
    }
    if (user.adminRole) {
      return user.adminRole as AdminRole;
    }
    return AdminRole.CUSTOMER_SUPPORT;
  }

  private getRolePermissions(role: AdminRole): AdminPermission[] {
    const rolePermissions: Record<AdminRole, AdminPermission[]> = {
      [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission),
      [AdminRole.ADMIN]: [
        AdminPermission.VIEW_CUSTOMERS,
        AdminPermission.EDIT_CUSTOMERS,
        AdminPermission.MANAGE_SUBSCRIPTIONS,
        AdminPermission.VIEW_CUSTOMER_ANALYTICS,
        AdminPermission.VIEW_CONTENT,
        AdminPermission.CREATE_CONTENT,
        AdminPermission.EDIT_CONTENT,
        AdminPermission.PUBLISH_CONTENT,
        AdminPermission.VIEW_REVENUE,
        AdminPermission.VIEW_ANALYTICS,
        AdminPermission.EXPORT_REPORTS,
        AdminPermission.VIEW_AUDIT_LOGS,
      ],
      [AdminRole.CUSTOMER_SUPPORT]: [
        AdminPermission.VIEW_CUSTOMERS,
        AdminPermission.EDIT_CUSTOMERS,
        AdminPermission.MANAGE_SUBSCRIPTIONS,
        AdminPermission.VIEW_CUSTOMER_ANALYTICS,
      ],
      [AdminRole.CONTENT_MANAGER]: [
        AdminPermission.VIEW_CONTENT,
        AdminPermission.CREATE_CONTENT,
        AdminPermission.EDIT_CONTENT,
        AdminPermission.DELETE_CONTENT,
        AdminPermission.PUBLISH_CONTENT,
      ],
      [AdminRole.BUSINESS_ANALYST]: [
        AdminPermission.VIEW_REVENUE,
        AdminPermission.VIEW_ANALYTICS,
        AdminPermission.EXPORT_REPORTS,
        AdminPermission.VIEW_BUSINESS_METRICS,
        AdminPermission.VIEW_CUSTOMER_ANALYTICS,
      ],
    };

    return rolePermissions[role] || [];
  }
}