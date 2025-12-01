import { PrismaClient, ProjectStatus, TaskStatus, TaskPriority, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedEnterpriseRoles } from './seeds/enterprise-roles.seed';
import { seedEnterprisePermissions } from './seeds/enterprise-permissions.seed';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding SIGMA ERP database...\n');

    // 1. Create Organization
    console.log('📦 Creating organization...');
    const org = await prisma.organization.upsert({
        where: { slug: 'acme-corp' },
        update: {},
        create: {
            name: 'Acme Corporation',
            slug: 'acme-corp',
            isActive: true,
        },
    });
    console.log(`✓ Organization: ${org.name}\n`);

    // 2. Create Enterprise Roles
    console.log('👥 Creating enterprise roles...');
    const roles = await seedEnterpriseRoles(prisma, org.id);
    const roleMap = new Map(roles.map(r => [r.name, r]));
    console.log(`✓ Created/Updated ${roles.length} roles\n`);

    // 3. Create Permissions and Assign to Roles
    console.log('🔐 Creating and assigning permissions...');
    await seedEnterprisePermissions(prisma, org.id);
    console.log(`✓ Permissions assigned\n`);

    // 4. Create Users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('Sigma2025!', 10); // Stronger default password

    const usersToCreate = [
        {
            email: 'j.molina@sigma.com',
            firstName: 'Julian',
            lastName: 'Molina',
            role: 'Superadmin',
        },
        {
            email: 'ceo@sigma.com',
            firstName: 'Carlos',
            lastName: 'CEO',
            role: 'CEO',
        },
        {
            email: 'cfo@sigma.com',
            firstName: 'Fernanda',
            lastName: 'CFO',
            role: 'CFO',
        },
        {
            email: 'contador.senior@sigma.com',
            firstName: 'Sergio',
            lastName: 'Contador',
            role: 'Contador Senior',
        },
        {
            email: 'gerente.ops@sigma.com',
            firstName: 'Gustavo',
            lastName: 'Operaciones',
            role: 'Gerente Operaciones',
        },
        {
            email: 'supervisor@sigma.com',
            firstName: 'Sandra',
            lastName: 'Supervisor',
            role: 'Supervisor',
        },
        {
            email: 'pm@sigma.com',
            firstName: 'Pablo',
            lastName: 'Manager',
            role: 'Project Manager',
        },
        {
            email: 'dev@sigma.com',
            firstName: 'David',
            lastName: 'Developer',
            role: 'Developer',
        },
        {
            email: 'operario@sigma.com',
            firstName: 'Oscar',
            lastName: 'Operario',
            role: 'Operario',
        },
    ];

    for (const userData of usersToCreate) {
        const role = roleMap.get(userData.role);
        if (!role) {
            console.warn(`⚠️ Role ${userData.role} not found for user ${userData.email}`);
            continue;
        }

        await prisma.user.upsert({
            where: {
                email_organizationId: {
                    email: userData.email,
                    organizationId: org.id,
                },
            },
            update: {
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                roleId: role.id,
                isActive: true,
            },
            create: {
                email: userData.email,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                roleId: role.id,
                organizationId: org.id,
                isActive: true,
            },
        });
        console.log(`✓ User: ${userData.email} (${userData.role})`);
    }
    console.log('');

    // 5. Create Chart of Accounts
    console.log('💰 Creating chart of accounts...');
    const accounts = [
        { name: 'Cash', code: '1001', type: AccountType.ASSET },
        { name: 'Bank - Checking', code: '1002', type: AccountType.ASSET },
        { name: 'Accounts Receivable', code: '1010', type: AccountType.ASSET },
        { name: 'Equipment', code: '1101', type: AccountType.ASSET },
        { name: 'Accounts Payable', code: '2001', type: AccountType.LIABILITY },
        { name: 'Long-term Loans', code: '2101', type: AccountType.LIABILITY },
        { name: "Owner's Capital", code: '3001', type: AccountType.EQUITY },
        { name: 'Retained Earnings', code: '3002', type: AccountType.EQUITY },
        { name: 'Service Revenue', code: '4001', type: AccountType.REVENUE },
        { name: 'Sales Revenue', code: '4002', type: AccountType.REVENUE },
        { name: 'Salaries & Wages', code: '5010', type: AccountType.EXPENSE },
        { name: 'Rent Expense', code: '5020', type: AccountType.EXPENSE },
        { name: 'Utilities', code: '5030', type: AccountType.EXPENSE },
    ];

    const accountMap = new Map();
    for (const acc of accounts) {
        const account = await prisma.account.upsert({
            where: {
                code_organizationId: {
                    code: acc.code,
                    organizationId: org.id,
                },
            },
            update: {},
            create: {
                ...acc,
                organizationId: org.id,
            },
        });
        accountMap.set(acc.code, account.id);
    }
    console.log(`✓ Created ${accounts.length} accounts\n`);

    // 6. Create Sample Projects
    console.log('📊 Creating sample projects...');
    const pmRole = roleMap.get('Project Manager');
    const pmUser = await prisma.user.findFirst({ where: { roleId: pmRole?.id } });

    if (pmUser) {
        const project1 = await prisma.project.create({
            data: {
                name: 'SIGMA ERP Platform',
                description: 'Building the core ERP system',
                status: ProjectStatus.ACTIVE,
                startDate: new Date('2025-01-01'),
                ownerId: pmUser.id,
                organizationId: org.id,
            },
        });

        const project2 = await prisma.project.create({
            data: {
                name: 'Mobile App Development',
                description: 'React Native mobile application',
                status: ProjectStatus.PLANNING,
                startDate: new Date('2025-02-01'),
                ownerId: pmUser.id,
                organizationId: org.id,
            },
        });
        console.log(`✓ Projects: ${project1.name}, ${project2.name}\n`);

        // 7. Create Sprints
        console.log('🏃 Creating sprints...');
        const sprint1 = await prisma.sprint.create({
            data: {
                name: 'Sprint 1 - Core Features',
                projectId: project1.id,
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-01-14'),
                goal: 'Implement authentication and basic CRUD',
                organizationId: org.id,
            },
        });

        const sprint2 = await prisma.sprint.create({
            data: {
                name: 'Sprint 2 - Finance Module',
                projectId: project1.id,
                startDate: new Date('2025-01-15'),
                endDate: new Date('2025-01-28'),
                goal: 'Complete double-entry accounting',
                organizationId: org.id,
            },
        });
        console.log(`✓ Sprints created\n`);

        // 8. Create Tasks
        console.log('✅ Creating tasks...');
        const devRole = roleMap.get('Developer');
        const devUser = await prisma.user.findFirst({ where: { roleId: devRole?.id } });

        if (devUser) {
            const tasks = [
                {
                    title: 'Implement user authentication',
                    description: 'JWT-based auth with refresh tokens',
                    status: TaskStatus.DONE,
                    priority: TaskPriority.HIGH,
                    projectId: project1.id,
                    sprintId: sprint1.id,
                    assigneeId: devUser.id,
                    reporterId: pmUser.id,
                    estimatedHours: 16,
                    actualHours: 14,
                    position: 0,
                },
                {
                    title: 'Create Projects module',
                    description: 'Full CRUD for projects',
                    status: TaskStatus.DONE,
                    priority: TaskPriority.HIGH,
                    projectId: project1.id,
                    sprintId: sprint1.id,
                    assigneeId: devUser.id,
                    reporterId: pmUser.id,
                    estimatedHours: 12,
                    actualHours: 10,
                    position: 1,
                },
                {
                    title: 'Build Kanban board',
                    description: 'Drag-and-drop task management',
                    status: TaskStatus.IN_PROGRESS,
                    priority: TaskPriority.MEDIUM,
                    projectId: project1.id,
                    sprintId: sprint2.id,
                    assigneeId: devUser.id,
                    reporterId: pmUser.id,
                    estimatedHours: 20,
                    position: 0,
                },
                {
                    title: 'Implement double-entry accounting',
                    description: 'Journal entries with validation',
                    status: TaskStatus.REVIEW,
                    priority: TaskPriority.CRITICAL,
                    projectId: project1.id,
                    sprintId: sprint2.id,
                    assigneeId: devUser.id,
                    reporterId: pmUser.id,
                    estimatedHours: 24,
                    actualHours: 22,
                    position: 1,
                },
                {
                    title: 'Design mobile UI mockups',
                    description: 'Figma designs for mobile app',
                    status: TaskStatus.TODO,
                    priority: TaskPriority.MEDIUM,
                    projectId: project2.id,
                    assigneeId: null,
                    reporterId: pmUser.id,
                    estimatedHours: 8,
                    position: 0,
                },
            ];

            for (const task of tasks) {
                await prisma.task.create({
                    data: {
                        ...task,
                        organizationId: org.id,
                    },
                });
            }
            console.log(`✓ Created ${tasks.length} tasks\n`);
        }
    }

    // 9. Create Sample Journal Entries
    console.log('📒 Creating journal entries...');
    const entry1 = await prisma.journalEntry.create({
        data: {
            description: 'Initial capital investment',
            date: new Date('2025-01-01'),
            reference: 'INIT-001',
            organizationId: org.id,
        },
    });

    await prisma.journalLine.create({
        data: {
            journalEntryId: entry1.id,
            debitAccountId: accountMap.get('1002'), // Bank
            creditAccountId: accountMap.get('3001'), // Owner's Capital
            amount: 100000,
        },
    });

    const entry2 = await prisma.journalEntry.create({
        data: {
            description: 'Client payment for services',
            date: new Date('2025-01-15'),
            reference: 'INV-001',
            organizationId: org.id,
        },
    });

    await prisma.journalLine.create({
        data: {
            journalEntryId: entry2.id,
            debitAccountId: accountMap.get('1002'), // Bank
            creditAccountId: accountMap.get('4001'), // Service Revenue
            amount: 25000,
        },
    });

    const entry3 = await prisma.journalEntry.create({
        data: {
            description: 'Monthly rent payment',
            date: new Date('2025-01-05'),
            reference: 'RENT-JAN',
            organizationId: org.id,
        },
    });

    await prisma.journalLine.create({
        data: {
            journalEntryId: entry3.id,
            debitAccountId: accountMap.get('5020'), // Rent Expense
            creditAccountId: accountMap.get('1002'), // Bank
            amount: 5000,
        },
    });

    console.log('✓ Created 3 journal entries\n');

    console.log('✨ Database seeding completed successfully!\n');
    console.log('📋 Credentials (Password: Sigma2025!):');
    usersToCreate.forEach(u => {
        console.log(`   - ${u.role}: ${u.email}`);
    });
    console.log('');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
