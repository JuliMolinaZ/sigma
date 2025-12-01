import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'j.molina@runsolutions-services.com';

    // Find Superadmin role
    const superadminRole = await prisma.role.findFirst({
        where: { name: 'Superadmin' }
    });

    if (!superadminRole) {
        console.error('Superadmin role not found!');
        return;
    }

    // Find user first
    const existingUser = await prisma.user.findFirst({
        where: { email }
    });

    if (!existingUser) {
        console.error('User not found!');
        return;
    }

    // Update user
    const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
            roleId: superadminRole.id
        },
        include: { role: true }
    });

    // @ts-ignore
    console.log(`Updated user ${user.email} to role ${user.role?.name}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
