
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_EMAILS = [
    'j.molina@runsolutions-services.com',
    'jc.yanez@runsolutions-services.com',
    'j.oviedo@runsolutions-services.com',
];

async function main() {
    console.log('🚀 Starting user cleanup...');
    console.log(`ℹ️  Keeping users: ${KEEP_EMAILS.join(', ')}`);

    const usersToDelete = await prisma.user.findMany({
        where: {
            email: {
                notIn: KEEP_EMAILS,
            },
        },
        select: { id: true, email: true },
    });

    console.log(`Found ${usersToDelete.length} users to delete.`);

    for (const user of usersToDelete) {
        console.log(`Processing user: ${user.email} (${user.id})...`);
        try {
            // 1. Delete/Unlink dependencies

            // Tasks (Reporter - Required) -> Delete tasks reported by user? Or reassign?
            // Assuming cleanup means "remove their traces" or they are test users.
            // Let's try to delete tasks they reported.
            await prisma.task.deleteMany({ where: { reporterId: user.id } });

            // Tasks (Assignee - Optional) -> Set to null
            await prisma.task.updateMany({
                where: { assigneeId: user.id },
                data: { assigneeId: null },
            });

            // Projects (Owner) -> Delete projects owned by user?
            // Check if they own projects.
            await prisma.project.deleteMany({ where: { ownerId: user.id } });

            // Project Members -> Disconnect
            // Implicit many-to-many usually handled by Prisma, but let's see.
            // Actually, schema showed @relation("ProjectMembers"), which is implicit.
            // Prisma handles deletion of implicit join table records automatically when user is deleted.

            // Dispatches (Sender/Recipient)
            // await prisma.dispatch.deleteMany({ where: { senderId: user.id } });
            // await prisma.dispatch.deleteMany({ where: { recipientId: user.id } });

            // Purchase Orders (Created/Authorized)
            await prisma.purchaseOrder.deleteMany({ where: { createdById: user.id } });
            await prisma.purchaseOrder.deleteMany({ where: { authorizedById: user.id } });

            // TimeEntries
            await prisma.timeEntry.deleteMany({ where: { userId: user.id } });

            // Comments
            await prisma.comment.deleteMany({ where: { userId: user.id } });

            // AuditLogs
            await prisma.auditLog.deleteMany({ where: { userId: user.id } });

            // Sessions
            await prisma.session.deleteMany({ where: { userId: user.id } });

            // ApiKeys
            // await prisma.apiKey.deleteMany({ where: { userId: user.id } });

            // Finally delete the user
            await prisma.user.delete({ where: { id: user.id } });
            console.log(`✅ Deleted user: ${user.email}`);
        } catch (error) {
            console.error(`❌ Failed to delete user ${user.email}:`, error);
        }
    }

    console.log('🎉 Cleanup finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
