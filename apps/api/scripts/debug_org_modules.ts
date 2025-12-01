import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Users and Organizations ---');

    const users = await prisma.user.findMany({
        where: {
            email: {
                in: ['j.molina@sigma.com', 'ceo@sigma.com']
            }
        },
        include: {
            organization: true,
            role: true
        }
    });

    for (const user of users) {
        console.log(`\nUser: ${user.email}`);
        console.log(`Role: ${user.role?.name}`);
        console.log(`Organization ID: ${user.organizationId}`);
        console.log(`Organization Name: ${user.organization?.name}`);

        // Check enabled modules for this org
        const modules = await prisma.organizationModule.findMany({
            where: {
                organizationId: user.organizationId,
                isEnabled: true
            }
        });
        console.log(`Enabled Modules Count: ${modules.length}`);
        if (modules.length > 0) {
            console.log(`Enabled Modules: ${modules.map(m => m.moduleId).join(', ')}`);
        } else {
            console.log('No enabled modules found (or all disabled).');
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
