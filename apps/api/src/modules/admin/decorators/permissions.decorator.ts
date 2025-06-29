import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '../interfaces/admin.interfaces';

export const RequirePermissions = (...permissions: AdminPermission[]) => 
  SetMetadata('permissions', permissions);