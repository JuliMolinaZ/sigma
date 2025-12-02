import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_EMAILS = [
    'j.molina@runsolutions-services.com',
    'jc.yanez@runsolutions-services.com',
    'j.oviedo@runsolutions-services.com',
];

const SAFE_USER_EMAIL = 'j.molina@runsolutions-services.com';

async function main() {
    console.log('Starting user cleanup...');

    // 1. Get the Safe User ID
    const safeUser = await prisma.user.findFirst({
        where: { email: SAFE_USER_EMAIL },
    });

    if (!safeUser) {
        console.error(`Safe user ${SAFE_USER_EMAIL} not found! Aborting.`);
        process.exit(1);
    }

    console.log(`Safe user found: ${safeUser.email} (${safeUser.id})`);

    // 2. Get Users to Delete
    const usersToDelete = await prisma.user.findMany({
        where: {
            email: {
                notIn: KEEP_EMAILS,
            },
        },
    });

    console.log(`Found ${usersToDelete.length} users to delete.`);

    for (const user of usersToDelete) {
        console.log(`Processing user: ${user.email} (${user.id})...`);

        try {
            // Reassign Tasks (Reporter)
            await prisma.task.updateMany({
                where: { reporterId: user.id },
                data: { reporterId: safeUser.id },
            });

            // Unassign Tasks (Assignee)
            await prisma.task.updateMany({
                where: { assigneeId: user.id },
                data: { assigneeId: null },
            });

            // Reassign Projects (Owner)
            await prisma.project.updateMany({
                where: { ownerId: user.id },
                data: { ownerId: safeUser.id },
            });

            // Disconnect Project Membership
            // Prisma doesn't have updateMany for implicit m-n, so we do it via the user update or raw query if needed.
            // Actually, deleting the user *should* remove them from implicit m-n tables automatically in Prisma,
            // BUT sometimes explicit relations block it.
            // Let's try deleting dependent data first.

            // Delete Dispatches
            await prisma.dispatch.deleteMany({
                where: {
                    OR: [{ senderId: user.id }, { recipientId: user.id }],
                },
            });

            // Delete Time Entries
            await prisma.timeEntry.deleteMany({
                where: { userId: user.id },
            });

            // Delete Expenses
            await prisma.expense.deleteMany({
                where: { userId: user.id },
            });

            // Delete Comments
            await prisma.comment.deleteMany({
                where: { userId: user.id },
            });

            // Delete Sessions
            await prisma.session.deleteMany({
                where: { userId: user.id },
            });

            // Delete Password Reset Tokens
            await prisma.passwordResetToken.deleteMany({
                where: { userId: user.id },
            });

            // Reassign Purchase Orders (Created By)
            await prisma.purchaseOrder.updateMany({
                where: { createdById: user.id },
                data: { createdById: safeUser.id },
            });

            // Reassign Purchase Orders (Authorized By)
            await prisma.purchaseOrder.updateMany({
                where: { authorizedById: user.id },
                data: { authorizedById: safeUser.id }, // Or null if allowed, but safeUser is safer
            });

            // Delete Audit Logs (optional, but good for cleanup)
            await prisma.auditLog.deleteMany({
                where: { userId: user.id },
            });

            // Finally, Delete the User
            await prisma.user.delete({
                where: { id: user.id },
            });

            console.log(`Deleted user: ${user.email}`);
        } catch (error) {
            console.error(`Failed to delete user ${user.email}:`, error);
        }
    }

    console.log('Cleanup complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
