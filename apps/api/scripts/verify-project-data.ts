
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        include: {
            client: true,
            owner: true,
            phase: true
        }
    });

    console.log(`Found ${projects.length} projects.`);

    projects.forEach(p => {
        console.log(`Project: ${p.name} (${p.id})`);
        console.log(`  Client: ${p.client ? p.client.nombre : 'MISSING (clientId: ' + p.clientId + ')'}`);
        console.log(`  Owner: ${p.owner ? p.owner.firstName : 'MISSING (ownerId: ' + p.ownerId + ')'}`);
        console.log(`  Phase: ${p.phase ? p.phase.name : 'MISSING (phaseId: ' + p.phaseId + ')'}`);
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
