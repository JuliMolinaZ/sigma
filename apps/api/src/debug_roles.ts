
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();
    console.log('--- Roles ---');
    roles.forEach(r => console.log(`- ${r.name} (Level: ${r.level})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
