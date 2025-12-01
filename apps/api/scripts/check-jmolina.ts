import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'j.molina@sigma.com'; // Trying the main one first
    const users = await prisma.user.findMany({
        where: {
            email: { contains: 'molina' }
        },
        include: {
            role: true
        }
    });

    console.log('Found users matching "molina":');
    users.forEach(u => {
        console.log(`- Email: ${u.email}, Role: ${u.role?.name}, RoleID: ${u.roleId}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
