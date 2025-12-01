
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const usersToCheck = [
        { email: 'j.molina@runsolutions-services.com', role: 'Superadmin' },
        { email: 'pm@sigma.com', role: 'Project Manager' }
    ];

    for (const u of usersToCheck) {
        const user = await prisma.user.findFirst({
            where: { email: u.email },
            include: { role: true }
        });

        if (!user) {
            console.log(`User ${u.email} not found`);
            continue;
        }

        console.log(`\n--- Testing for ${user.email} (${user.role.name}) ---`);
        const userId = user.id;
        const organizationId = user.organizationId;
        const role = user.role.name;

        const where: any = {
            organizationId,
            deletedAt: null,
        };

        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'SUPERADMINISTRATOR', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES'].includes(role?.toUpperCase());
        console.log(`Is Admin? ${isAdmin}`);

        if (!isAdmin) {
            where.OR = [
                { ownerId: userId }, // Primary Project Owner
                { owners: { some: { id: userId } } }, // Co-Owner
                { members: { some: { id: userId } } }, // Team Member
                {
                    tasks: {
                        some: {
                            assigneeId: userId // Assigned to a task
                        }
                    }
                },
            ];
        }

        console.log(`Query Where: ${JSON.stringify(where, null, 2)}`);

        const projects = await prisma.project.findMany({
            where,
            select: { id: true, name: true }
        });

        console.log(`Found ${projects.length} projects:`);
        projects.forEach(p => console.log(`- ${p.name} (${p.id})`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
