import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for 'Legacy' or 'RUN SOLUTIONS'...");
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { name: { contains: 'Legacy', mode: 'insensitive' } },
                { name: { contains: 'RUN SOLUTIONS', mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            name: true,
            clientId: true,
            ownerId: true,
            organizationId: true,
            client: { select: { nombre: true, organizationId: true } }
        }
    });

    projects.forEach(p => {
        console.log(`Project: "${p.name}" (ID: ${p.id})`);
        console.log(`  OrgId: ${p.organizationId}`);
        console.log(`  Client: ${p.client?.nombre || 'NULL'} (ID: ${p.clientId})`);
        console.log(`  Client OrgId: ${p.client?.organizationId || 'NULL'}`);
        console.log(`  OwnerId: ${p.ownerId}`);
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
