import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Setting up Users and Permissions ---');

    // 1. Get Organization and Roles
    const orgId = 'cdeeb8d7-e39a-4af6-818b-bc7864a9f442'; // RUNITE Legacy
    const ceoRole = await prisma.role.findFirst({ where: { name: 'CEO', organizationId: orgId } });
    const cfoRole = await prisma.role.findFirst({ where: { name: 'CFO', organizationId: orgId } });

    if (!ceoRole || !cfoRole) {
        console.error('CEO or CFO role not found');
        return;
    }

    // 2. Ensure Permissions for Clients and Suppliers
    const resources = ['clients', 'suppliers'];
    const actions = ['read', 'create', 'update', 'delete', 'export', 'manage', 'admin'];

    for (const resource of resources) {
        for (const action of actions) {
            const perm = await prisma.permission.upsert({
                where: { resource_action: { resource, action } },
                update: {},
                create: {
                    resource,
                    action,
                    description: `Manage ${resource} (${action})`
                }
            });

            // Assign to CEO
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: ceoRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: ceoRole.id, permissionId: perm.id }
            });

            // Assign to CFO
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: cfoRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: cfoRole.id, permissionId: perm.id }
            });
        }
    }
    console.log('Permissions for Clients and Suppliers assigned.');

    // 3. Get Password Hash from existing user
    const existingUser = await prisma.user.findFirst({ where: { email: 'j.molina@sigma.com' } });
    if (!existingUser) {
        console.error('Reference user not found');
        return;
    }
    const passwordHash = existingUser.password;

    // 4. Create/Update Juan Carlos (CEO)
    const juanCarlos = await prisma.user.upsert({
        where: {
            email_organizationId: {
                email: 'juan.carlos@sigma.com',
                organizationId: orgId
            }
        },
        update: {
            firstName: 'Juan',
            lastName: 'Carlos',
            roleId: ceoRole.id,
            password: passwordHash,
            isActive: true
        },
        create: {
            email: 'juan.carlos@sigma.com',
            firstName: 'Juan',
            lastName: 'Carlos',
            roleId: ceoRole.id,
            organizationId: orgId,
            password: passwordHash,
            isActive: true
        }
    });
    console.log(`User created/updated: ${juanCarlos.email} (CEO)`);

    // 5. Create/Update Jessica (CFO)
    const jessica = await prisma.user.upsert({
        where: {
            email_organizationId: {
                email: 'jessica@sigma.com',
                organizationId: orgId
            }
        },
        update: {
            firstName: 'Jessica',
            lastName: 'CFO',
            roleId: cfoRole.id,
            password: passwordHash,
            isActive: true
        },
        create: {
            email: 'jessica@sigma.com',
            firstName: 'Jessica',
            lastName: 'CFO',
            roleId: cfoRole.id,
            organizationId: orgId,
            password: passwordHash,
            isActive: true
        }
    });
    console.log(`User created/updated: ${jessica.email} (CFO)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
