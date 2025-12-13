
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, role: { select: { name: true } } }
    });

    console.log('Current Users:');
    users.forEach(u => console.log(`- ${u.email} (${u.role.name})`));
    console.log(`Total: ${users.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
