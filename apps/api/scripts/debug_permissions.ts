import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Role Permissions ---');

    const roles = await prisma.role.findMany({
        where: {
            name: {
                in: ['CEO', 'CFO', 'Superadmin']
            }
        },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    for (const role of roles) {
        console.log(`\nRole: ${role.name}`);
        console.log(`Permissions:`);
        if (role.permissions.length === 0) {
            console.log('  (None)');
        }
        for (const rp of role.permissions) {
            console.log(`  - ${rp.permission.resource}:${rp.permission.action}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
