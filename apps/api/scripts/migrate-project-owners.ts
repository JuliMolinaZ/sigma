import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting migration of Project Owners...");

    // Get all projects with an ownerId
    const projects = await prisma.project.findMany({
        where: {
            ownerId: { not: null }
        },
        select: {
            id: true,
            ownerId: true,
            name: true
        }
    });

    console.log(`Found ${projects.length} projects to migrate.`);

    let migratedCount = 0;

    for (const project of projects) {
        if (!project.ownerId) continue;

        try {
            // Connect the existing owner to the new owners relation
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    owners: {
                        connect: { id: project.ownerId }
                    }
                }
            });
            console.log(`Migrated owner for project: ${project.name}`);
            migratedCount++;
        } catch (error) {
            console.error(`Failed to migrate project ${project.name}:`, error);
        }
    }

    console.log(`Migration complete. Migrated ${migratedCount} projects.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
