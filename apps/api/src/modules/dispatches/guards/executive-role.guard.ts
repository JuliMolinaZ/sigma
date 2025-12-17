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

        // Allow access to all authenticated users
        // Command Center is now available to everyone
        return true;
    }
}
