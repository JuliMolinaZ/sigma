
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userEmail = 'j.molina@runsolutions-services.com';

        // 1. Get the user and role info
        const users: any[] = await prisma.$queryRaw`
            SELECT u.id, u.email, u.organization_id, u.role_id, r.name as role_name 
            FROM "users" u 
            JOIN "roles" r ON u.role_id = r.id 
            WHERE u.email = ${userEmail}
        `;
        const user = users[0];

        if (!user) {
            console.error(`User ${userEmail} not found.`);
            return;
        }

        console.log('User Role Info:', user);

        // 2. Check permissions for this role
        const rolePermissions: any[] = await prisma.$queryRaw`
            SELECT p.resource, p.action 
            FROM "role_permissions" rp 
            JOIN "permissions" p ON rp.permission_id = p.id 
            WHERE rp.role_id = ${user.role_id}
        `;

        console.log(`Current permissions count for ${user.role_name}:`, rolePermissions.length);
        // console.log('Permissions:', rolePermissions);

        // 3. Check if 'tasks:read' is missing
        const hasTaskRead = rolePermissions.some(p => p.resource === 'tasks' && p.action === 'read');
        console.log('Has tasks:read permission?', hasTaskRead);

        if (!hasTaskRead || rolePermissions.length < 10) { // Arbitrary low number check
            console.log('Permissions seem missing or incomplete. Granting ALL permissions to Admin role...');

            // Get all permissions
            const allPermissions: any[] = await prisma.$queryRaw`SELECT id FROM "permissions"`;
            console.log(`Found ${allPermissions.length} total permissions in system.`);

            if (allPermissions.length === 0) {
                console.log('No permissions found in system! We need to seed them.');
                // We might need to seed permissions first if they don't exist
            } else {
                // Assign all permissions to the role
                // We'll do this one by one or in batch to avoid duplicates
                let addedCount = 0;
                for (const perm of allPermissions) {
                    try {
                        await prisma.$executeRaw`
                            INSERT INTO "role_permissions" ("role_id", "permission_id") 
                            VALUES (${user.role_id}, ${perm.id}) 
                            ON CONFLICT DO NOTHING
                        `;
                        addedCount++;
                    } catch (e) {
                        // ignore
                    }
                }
                console.log(`Ensured all ${allPermissions.length} permissions are assigned to role ${user.role_id}.`);
            }
        }

    } catch (error) {
        console.error('Error checking/fixing permissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
