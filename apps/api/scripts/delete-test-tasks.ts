import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestTasks() {
    try {
        // Test task titles to delete
        const testTaskTitles = [
            'Build Kanban board',
            'Design mobile UI mockups',
            'Implement double-entry accounting',
        ];

        console.log('🗑️  Deleting test tasks...\n');

        // Delete tasks with these titles
        const result = await prisma.task.deleteMany({
            where: {
                title: {
                    in: testTaskTitles,
                },
            },
        });

        console.log(`✅ Deleted ${result.count} test tasks`);
        console.log('\nTest tasks deleted successfully!');
    } catch (error) {
        console.error('❌ Error deleting test tasks:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteTestTasks()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
