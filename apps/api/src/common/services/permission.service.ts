import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionAction, PermissionScope, PermissionConfig } from '../decorators/permissions.decorator';

/**
 * Permission Service
 * Centralized permission logic with RBAC + PBAC + TBAC support
 */

@Injectable()
export class PermissionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Check if user has specific permissions
     */
    async hasPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
        if (!userId) return false;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.role) return false;

        // Superadmin has all permissions
        if (user.role.name === 'Superadmin') return true;

        const userPermissions = user.role.permissions.map(
            rp => `${rp.permission.resource}:${rp.permission.action}`
        );

        // Check if user has all required permissions
        return requiredPermissions.every(required => {
            // Check for exact match
            if (userPermissions.includes(required)) return true;

            // Check for wildcard permissions
            const [resource, action] = required.split(':');

            // Check resource:* (all actions on resource)
            if (userPermissions.includes(`${resource}:*`)) return true;

            // Check *:action (action on all resources)
            if (userPermissions.includes(`*:${action}`)) return true;

            // Check *:* (all permissions)
            if (userPermissions.includes('*:*')) return true;

            return false;
        });
    }

    /**
     * Check advanced permission with scope
     */
    async hasAdvancedPermission(
        userId: string,
        config: PermissionConfig,
        resourceOwnerId?: string,
        resourceTeamIds?: string[]
    ): Promise<boolean> {
        if (!userId) return false;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user) return false;

        // Check basic permission first
        const hasBasicPermission = await this.hasPermissions(
            userId,
            [`${config.resource}:${config.action}`]
        );

        if (!hasBasicPermission) return false;

        // Check scope if specified
        if (config.scope) {
            return this.checkScope(config.scope, userId, resourceOwnerId, resourceTeamIds);
        }

        return true;
    }

    /**
     * Check scope-based access
     */
    private checkScope(
        scope: PermissionScope,
        userId: string,
        resourceOwnerId?: string,
        resourceTeamIds?: string[]
    ): boolean {
        switch (scope) {
            case PermissionScope.OWN:
                return userId === resourceOwnerId;

            case PermissionScope.TEAM:
                return resourceTeamIds?.includes(userId) || userId === resourceOwnerId;

            case PermissionScope.ALL:
                return true;

            default:
                return false;
        }
    }

    /**
     * Check if user has financial access
     */
    async hasFinancialAccess(userId: string): Promise<boolean> {
        if (!userId) return false;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user || !user.role) return false;

        const financialRoles = [
            'Superadmin',
            'CEO',
            'Owner',
            'CFO',
            'Contador Senior',
            'Contador',
        ];

        return financialRoles.includes(user.role.name);
    }

    /**
     * Check minimum role level
     */
    async hasMinimumRoleLevel(userId: string, minimumLevel: number): Promise<boolean> {
        if (!userId) return false;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user || !user.role) return false;

        return user.role.level >= minimumLevel;
    }

    /**
     * Check role category
     */
    async hasRoleCategory(userId: string, categories: string[]): Promise<boolean> {
        if (!userId) return false;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user || !user.role || !user.role.category) return false;

        return categories.includes(user.role.category);
    }

    /**
     * Get user's effective permissions
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        if (!userId) return [];

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.role) return [];

        return user.role.permissions.map(
            rp => `${rp.permission.resource}:${rp.permission.action}`
        );
    }

    /**
     * Check if user can approve (requires level 7+)
     */
    async canApprove(userId: string): Promise<boolean> {
        return this.hasMinimumRoleLevel(userId, 7);
    }

    /**
     * Check if user can manage (requires level 6+)
     */
    async canManage(userId: string): Promise<boolean> {
        return this.hasMinimumRoleLevel(userId, 6);
    }
}
