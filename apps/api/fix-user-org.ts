
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userEmail = 'j.molina@runsolutions-services.com';

        const users: any[] = await prisma.$queryRaw`SELECT u.id, u.email, u.organization_id, o.name as org_name, u.password FROM "users" u JOIN "organizations" o ON u.organization_id = o.id WHERE u.email = ${userEmail}`;

        console.log('Found users:', users);

        // Find the one in RUNITE Legacy
        const correctUser = users.find(u => u.org_name === 'RUNITE Legacy');
        const wrongUser = users.find(u => u.org_name !== 'RUNITE Legacy');

        if (correctUser && wrongUser) {
            console.log('Found duplicate users. Updating password for the correct one and archiving the wrong one.');

            // Update password for correct user
            await prisma.$executeRaw`UPDATE "users" SET "password" = ${wrongUser.password} WHERE "id" = ${correctUser.id}`;
            console.log('Updated password for correct user.');

            // Archive wrong user by changing email
            const archivedEmail = `j.molina+archived@runsolutions-services.com`;
            await prisma.$executeRaw`UPDATE "users" SET "email" = ${archivedEmail} WHERE "id" = ${wrongUser.id}`;
            console.log(`Archived wrong user to ${archivedEmail}.`);
        } else if (correctUser) {
            console.log('Only correct user found. Nothing to do.');
        } else {
            console.log('Correct user not found?');
        }

    } catch (error) {
        console.error('Error inspecting users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
