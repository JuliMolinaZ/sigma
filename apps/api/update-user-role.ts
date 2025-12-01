
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userEmail = 'j.molina@runsolutions-services.com';

        // 1. Find the user and their organization
        const users: any[] = await prisma.$queryRaw`SELECT u.id, u.email, u.organization_id, u.role_id, o.name as org_name FROM "users" u JOIN "organizations" o ON u.organization_id = o.id WHERE u.email = ${userEmail}`;
        const user = users[0];

        if (!user) {
            console.error(`User ${userEmail} not found.`);
            return;
        }

        console.log('User found:', user);

        // 2. Find the Superadmin role in the user's organization
        // We look for 'Superadmin' or 'Super Administrador' or similar.
        const roles: any[] = await prisma.$queryRaw`SELECT * FROM "roles" WHERE organization_id = ${user.organization_id}`;
        console.log('Available roles:', roles.map(r => ({ id: r.id, name: r.name })));

        const superAdminRole = roles.find(r => r.name === 'Superadmin');

        if (!superAdminRole) {
            console.error('Superadmin role not found in organization.');
            // Create it if it doesn't exist? Ideally it should exist.
            return;
        }

        console.log(`Found Superadmin role: ${superAdminRole.name} (${superAdminRole.id})`);

        // 3. Update the user's role
        const result = await prisma.$executeRaw`UPDATE "users" SET "role_id" = ${superAdminRole.id} WHERE "id" = ${user.id}`;
        console.log(`Successfully updated user role to ${superAdminRole.name}. Rows affected: ${result}`);

    } catch (error) {
        console.error('Error updating user role:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
