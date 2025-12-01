import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Updating CEO and CFO Permissions ---');

    // 1. Get Roles for RUNITE Legacy
    const orgId = 'cdeeb8d7-e39a-4af6-818b-bc7864a9f442'; // RUNITE Legacy ID
    const ceoRole = await prisma.role.findFirst({ where: { name: 'CEO', organizationId: orgId } });
    const cfoRole = await prisma.role.findFirst({ where: { name: 'CFO', organizationId: orgId } });

    if (!ceoRole || !cfoRole) {
        console.error('CEO or CFO role not found');
        return;
    }

    // 2. Define permissions to add
    // The controllers use 'finance:read', 'finance:create', etc.
    // We need to ensure these permissions EXIST in the Permission table first.
    const financeActions = ['read', 'create', 'update', 'delete', 'export', 'approve', 'manage', 'admin'];
    const financeResource = 'finance';

    // Ensure 'finance' permissions exist
    for (const action of financeActions) {
        await prisma.permission.upsert({
            where: { resource_action: { resource: financeResource, action } },
            update: {},
            create: {
                resource: financeResource,
                action,
                description: `Manage finance (${action})`
            }
        });
    }

    // 3. Get all finance permissions
    const financePermissions = await prisma.permission.findMany({
        where: {
            resource: 'finance'
        }
    });

    // 4. Assign to CEO
    console.log('Assigning finance permissions to CEO...');
    for (const perm of financePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: ceoRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: ceoRole.id,
                permissionId: perm.id
            }
        });
    }

    // 5. Assign to CFO
    // CFO should have all finance permissions + some basic ones
    console.log('Assigning permissions to CFO...');

    // Get all finance-related permissions (including submodules like finance.accounts)
    const allFinancePermissions = await prisma.permission.findMany({
        where: {
            OR: [
                { resource: 'finance' },
                { resource: { startsWith: 'finance.' } },
                { resource: 'dashboard' },
                { resource: 'reports' },
                { resource: 'analytics' }
            ]
        }
    });

    for (const perm of allFinancePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: cfoRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: cfoRole.id,
                permissionId: perm.id
            }
        });
    }

    console.log('Permissions updated successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
