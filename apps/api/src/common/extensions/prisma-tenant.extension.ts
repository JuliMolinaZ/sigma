import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../context/tenant.context';

export const prismaTenantExtension = (prisma: PrismaClient) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const tenantId = TenantContext.getTenantId();

                    // Models to exclude from tenant filtering (e.g., Organization itself, or System tables)
                    // Permission is global and not tenant-specific
                    // RolePermission is a junction table without organizationId (filtering is done through Role relation)
                    const globalModels = ['Organization', 'AuditLog', 'Session', 'PasswordResetToken', 'Permission', 'RolePermission'];

                    if (tenantId && !globalModels.includes(model)) {
                        if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'count' || operation === 'aggregate' || operation === 'groupBy') {
                            args.where = { ...args.where, organizationId: tenantId };
                        }

                        if (operation === 'create' || operation === 'createMany') {
                            if (args.data) {
                                if (Array.isArray(args.data)) {
                                    args.data.forEach((item: any) => {
                                        item.organizationId = tenantId;
                                    });
                                } else {
                                    (args.data as any).organizationId = tenantId;
                                }
                            }
                        }

                        if (operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
                            args.where = { ...args.where, organizationId: tenantId };
                        }
                    }

                    return query(args);
                },
            },
        },
    });
};
