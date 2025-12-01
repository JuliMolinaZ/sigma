
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Find RUNITE Legacy organization
        const orgs: any[] = await prisma.$queryRaw`SELECT * FROM "organizations" WHERE name = 'RUNITE Legacy' LIMIT 1`;
        const targetOrg = orgs[0];

        if (!targetOrg) {
            console.error('Target organization "RUNITE Legacy" not found!');
            return;
        }

        console.log(`Checking roles for organization: ${targetOrg.name} (${targetOrg.id})`);

        const roles: any[] = await prisma.$queryRaw`SELECT * FROM "roles" WHERE organization_id = ${targetOrg.id}`;
        console.log('Existing Roles:', roles.map(r => ({ id: r.id, name: r.name, level: r.level })));

    } catch (error) {
        console.error('Error checking roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
