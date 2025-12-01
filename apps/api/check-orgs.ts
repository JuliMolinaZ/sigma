
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Get the user
        const userEmail = 'j.molina@runsolutions-services.com';
        const users: any[] = await prisma.$queryRaw`SELECT * FROM "users" WHERE email = ${userEmail}`;
        const user = users[0];

        if (!user) {
            console.log(`User ${userEmail} not found.`);
        } else {
            console.log('User Organization:', {
                userId: user.id,
                email: user.email,
                organizationId: user.organization_id, // Note: raw sql uses snake_case usually, but let's check
            });
        }

        // 2. Get a sample migrated Client
        // We assume migrated clients have legacy_client_id not null
        const clients: any[] = await prisma.$queryRaw`SELECT * FROM "clients" WHERE legacy_client_id IS NOT NULL LIMIT 1`;
        const client = clients[0];

        if (!client) {
            console.log('No migrated clients found.');
        } else {
            console.log('Sample Migrated Client Organization:', {
                clientId: client.id,
                name: client.nombre,
                organizationId: client.organization_id,
            });
        }

        // 3. Get a sample migrated Project
        const projects: any[] = await prisma.$queryRaw`SELECT * FROM "projects" WHERE legacy_project_id IS NOT NULL LIMIT 1`;
        const project = projects[0];

        if (!project) {
            console.log('No migrated projects found.');
        } else {
            console.log('Sample Migrated Project Organization:', {
                projectId: project.id,
                name: project.name,
                organizationId: project.organization_id,
            });
        }

        // 4. List all organizations
        const orgs: any[] = await prisma.$queryRaw`SELECT * FROM "organizations"`;
        console.log('All Organizations:', orgs.map(o => ({ id: o.id, name: o.name })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
