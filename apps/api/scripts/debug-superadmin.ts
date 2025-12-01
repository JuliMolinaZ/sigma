import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'j.molina@runsolutions-services.com';
    console.log(`Debugging user: ${email}`);

    const user = await prisma.user.findFirst({
        where: { email },
        include: { role: true, organization: true }
    });

    if (!user) {
        console.error('User not found!');
        // Try to list all users to see who exists
        const allUsers = await prisma.user.findMany({ take: 5 });
        console.log('First 5 users in DB:', allUsers.map(u => u.email));
        return;
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        role: user.role.name,
        organizationId: user.organizationId,
        organizationName: user.organization.name
    });

    // Check projects in this org
    const projectsCount = await prisma.project.count({
        where: { organizationId: user.organizationId }
    });
    console.log(`Total projects in Org (${user.organizationId}): ${projectsCount}`);

    const projects = await prisma.project.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        take: 20,
        include: {
            owner: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: {
                    tasks: true,
                    sprints: true,
                },
            },
        },
    });
    console.log(`Found ${projects.length} projects with full query.`);
    projects.forEach(p => console.log(` - ${p.name} (Owner: ${p.owner?.email})`));

    // Simulate findAll logic
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES'].includes(user.role.name.toUpperCase());
    console.log(`Is Admin (Logic Check): ${isAdmin}`);

    if (isAdmin) {
        console.log('User is Admin, should see all projects in Org.');
    } else {
        console.log('User is NOT Admin, checking assignments...');
        // ... (Not needed if user is Superadmin)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
