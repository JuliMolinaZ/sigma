import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            clientId: true,
            ownerId: true,
            client: { select: { nombre: true } },
            owner: { select: { firstName: true, lastName: true } }
        }
    });

    console.log('Total Projects:', projects.length);

    const missingClient = projects.filter(p => !p.clientId);
    const missingOwner = projects.filter(p => !p.ownerId);

    console.log('Projects missing ClientId:', missingClient.length);
    if (missingClient.length > 0) {
        console.log('Sample missing client:', missingClient[0]);
    }

    console.log('Projects missing OwnerId:', missingOwner.length);
    if (missingOwner.length > 0) {
        console.log('Sample missing owner:', missingOwner[0]);
    }

    // Check if any have ID but no relation loaded (integrity issue)
    const orphanedClient = projects.filter(p => p.clientId && !p.client);
    const orphanedOwner = projects.filter(p => p.ownerId && !p.owner);

    console.log('Projects with ClientId but no Client found:', orphanedClient.length);
    console.log('Projects with OwnerId but no Owner found:', orphanedOwner.length);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
