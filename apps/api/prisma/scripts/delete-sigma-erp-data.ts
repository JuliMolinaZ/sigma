import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting deletion of "SIGMA ERP Platform" projects...');

    const projects = await prisma.project.findMany({
        where: {
            name: 'SIGMA ERP Platform',
        },
    });

    console.log(`Found ${projects.length} projects named "SIGMA ERP Platform".`);

    if (projects.length > 0) {
        // Delete tasks associated with these projects first (though cascade should handle it, explicit is safer/clearer log)
        const projectIds = projects.map(p => p.id);

        const tasks = await prisma.task.deleteMany({
            where: {
                projectId: { in: projectIds }
            }
        });
        console.log(`Deleted ${tasks.count} associated tasks.`);

        const deleted = await prisma.project.deleteMany({
            where: {
                id: { in: projectIds }
            },
        });
        console.log(`Deleted ${deleted.count} projects.`);
    } else {
        console.log('No projects found.');
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
