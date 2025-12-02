import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

const EXECUTIVE_ROLES = [
    'CEO',
    'CFO',
    'CTO',
    'COO',
    'CCO',
    'SUPERADMIN',
    'ADMINISTRATOR',
    'SUPER_ADMIN',
    'SUPERADMINISTRATOR',
    'GERENTE OPERACIONES',
];

@Injectable()
export class ExecutiveRoleGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('User role not found');
        }

        const roleName = user.role.name || user.role;
        const isExecutive = EXECUTIVE_ROLES.some(
            (execRole) => roleName.toUpperCase() === execRole.toUpperCase()
        );

        if (!isExecutive) {
            throw new ForbiddenException(
                'Access denied. Command Center is restricted to C-Suite executives only.'
            );
        }

        return true;
    }
}
