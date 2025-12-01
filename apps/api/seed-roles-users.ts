
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Password hash for 'Sigma2025!'
const PASSWORD_HASH = '$2b$10$C604jEPXaAK5lqk6jEaXcOpnAld4oG7lxyxly8zAtiZlIvOrymg26';

const ROLES = [
    { name: 'Superadmin', level: 10, description: 'Full system access' },
    { name: 'CEO', level: 9, description: 'Chief Executive Officer' },
    { name: 'CFO', level: 8, description: 'Chief Financial Officer' },
    { name: 'Contador Senior', level: 7, description: 'Senior Accountant' },
    { name: 'Gerente Operaciones', level: 7, description: 'Operations Manager' },
    { name: 'Supervisor', level: 6, description: 'Team Supervisor' },
    { name: 'Project Manager', level: 5, description: 'Project Manager' },
    { name: 'Developer', level: 3, description: 'Software Developer' },
    { name: 'Operario', level: 3, description: 'General Operator' },
];

const USERS = [
    { email: 'j.molina@runsolutions-services.com', firstName: 'Julian', lastName: 'Molina', role: 'Superadmin' },
    { email: 'ceo@sigma.com', firstName: 'Carlos', lastName: 'CEO', role: 'CEO' },
    { email: 'cfo@sigma.com', firstName: 'Fernanda', lastName: 'CFO', role: 'CFO' },
    { email: 'contador.senior@sigma.com', firstName: 'Sergio', lastName: 'Contador', role: 'Contador Senior' },
    { email: 'gerente.ops@sigma.com', firstName: 'Gustavo', lastName: 'Operaciones', role: 'Gerente Operaciones' },
    { email: 'supervisor@sigma.com', firstName: 'Sandra', lastName: 'Supervisor', role: 'Supervisor' },
    { email: 'pm@sigma.com', firstName: 'Pablo', lastName: 'Manager', role: 'Project Manager' },
    { email: 'dev@sigma.com', firstName: 'David', lastName: 'Developer', role: 'Developer' },
    { email: 'operario@sigma.com', firstName: 'Oscar', lastName: 'Operario', role: 'Operario' },
];

async function main() {
    try {
        // 1. Get Organization
        const orgs: any[] = await prisma.$queryRaw`SELECT * FROM "organizations" WHERE name = 'RUNITE Legacy' LIMIT 1`;
        const org = orgs[0];

        if (!org) {
            console.error('Organization RUNITE Legacy not found');
            return;
        }
        console.log(`Using Organization: ${org.name} (${org.id})`);

        // 2. Upsert Roles
        const roleMap = new Map<string, string>(); // name -> id

        for (const roleDef of ROLES) {
            // Check if role exists
            const existingRoles: any[] = await prisma.$queryRaw`
                SELECT * FROM "roles" 
                WHERE organization_id = ${org.id} AND name = ${roleDef.name}
            `;

            let roleId;
            if (existingRoles.length > 0) {
                roleId = existingRoles[0].id;
                // Update level if needed
                await prisma.$executeRaw`
                    UPDATE "roles" SET level = ${roleDef.level}, description = ${roleDef.description}
                    WHERE id = ${roleId}
                `;
                console.log(`Updated role: ${roleDef.name}`);
            } else {
                // Create role
                const id = crypto.randomUUID();
                await prisma.$executeRaw`
                    INSERT INTO "roles" (id, name, description, level, organization_id, "updated_at")
                    VALUES (${id}, ${roleDef.name}, ${roleDef.description}, ${roleDef.level}, ${org.id}, NOW())
                `;
                roleId = id;
                console.log(`Created role: ${roleDef.name}`);
            }
            roleMap.set(roleDef.name, roleId);
        }

        // 3. Upsert Users
        for (const userDef of USERS) {
            const roleId = roleMap.get(userDef.role);
            if (!roleId) {
                console.error(`Role ID not found for ${userDef.role}`);
                continue;
            }

            // Check if user exists
            const existingUsers: any[] = await prisma.$queryRaw`
                SELECT * FROM "users" WHERE email = ${userDef.email}
            `;

            if (existingUsers.length > 0) {
                const user = existingUsers[0];
                // Update user
                await prisma.$executeRaw`
                    UPDATE "users" 
                    SET 
                        "first_name" = ${userDef.firstName},
                        "last_name" = ${userDef.lastName},
                        "role_id" = ${roleId},
                        "organization_id" = ${org.id},
                        "password" = ${PASSWORD_HASH}
                    WHERE id = ${user.id}
                `;
                console.log(`Updated user: ${userDef.email}`);
            } else {
                // Create user
                const id = crypto.randomUUID();
                await prisma.$executeRaw`
                    INSERT INTO "users" (id, email, "first_name", "last_name", password, role_id, organization_id, "updated_at")
                    VALUES (${id}, ${userDef.email}, ${userDef.firstName}, ${userDef.lastName}, ${PASSWORD_HASH}, ${roleId}, ${org.id}, NOW())
                `;
                console.log(`Created user: ${userDef.email}`);
            }
        }

        // 4. Assign Permissions (Basic: Give Superadmin & CEO everything)
        const superAdminId = roleMap.get('Superadmin');
        const ceoId = roleMap.get('CEO');

        if (superAdminId || ceoId) {
            const allPermissions: any[] = await prisma.$queryRaw`SELECT id FROM "permissions"`;
            console.log(`Assigning ${allPermissions.length} permissions to Superadmin and CEO...`);

            const rolesToGrant = [superAdminId, ceoId].filter(Boolean);

            for (const rid of rolesToGrant) {
                for (const perm of allPermissions) {
                    try {
                        await prisma.$executeRaw`
                            INSERT INTO "role_permissions" ("role_id", "permission_id") 
                            VALUES (${rid}, ${perm.id}) 
                            ON CONFLICT DO NOTHING
                        `;
                    } catch (e) { }
                }
            }
            console.log('Permissions assigned.');
        }

    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
