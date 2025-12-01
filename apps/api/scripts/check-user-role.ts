import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = "j.molina@runsolutions-services.com"; // Inferred from previous debug output
    console.log(`Searching for user: ${email}`);

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { firstName: 'Julian', lastName: 'Molina' }
            ]
        },
        include: {
            role: true,
            organization: true
        }
    });

    if (!user) {
        console.log("User not found.");
        return;
    }

    console.log("--- User Found ---");
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role Name: '${user.role?.name}'`);
    console.log(`Role ID: ${user.roleId}`);
    console.log(`Organization: ${user.organization?.name} (${user.organizationId})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
