import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { isExecutiveRole } from '../../../common/constants/roles.constants';

@Injectable()
export class ExecutiveRoleGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('User role not found');
        }

        // Super Admin Bypass (same as PermissionsGuard)
        if (user.email === 'j.molina@runsolutions-services.com') {
            return true;
        }

        const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
        const isExecutive = isExecutiveRole(roleName);

        if (!isExecutive) {
            throw new ForbiddenException(
                `Access denied. Command Center is restricted to C-Suite executives and Superadmins only. Your role: ${roleName}`
            );
        }

        return true;
    }
}
