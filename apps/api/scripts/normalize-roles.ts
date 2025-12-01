import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORGANIZATION_ID = '0b0ed7dd-3277-4980-9497-18b0fe7e7e62';

const ROLES = [
    // Level 10: System Administrator
    {
        name: 'Superadmin',
        description: 'Full system access with no restrictions',
        level: 10,
        category: 'executive',
        isSystem: true,
    },

    // Level 9: C-Level Executives
    {
        name: 'CEO',
        description: 'Chief Executive Officer - Full business access',
        level: 9,
        category: 'executive',
        isSystem: false,
    },
    {
        name: 'Owner',
        description: 'Business Owner - Full business access',
        level: 9,
        category: 'executive',
        isSystem: false,
    },

    // Level 8: Department Heads
    {
        name: 'CFO',
        description: 'Chief Financial Officer - Full financial access',
        level: 8,
        category: 'financial',
        isSystem: false,
    },
    {
        name: 'CTO',
        description: 'Chief Technology Officer - Full technical access',
        level: 8,
        category: 'technical',
        isSystem: false,
    },
    {
        name: 'COO',
        description: 'Chief Operating Officer - Full operational access',
        level: 8,
        category: 'operational',
        isSystem: false,
    },

    // Level 7: Senior Management
    {
        name: 'Contador Senior',
        description: 'Senior Accountant - Full accounting access with approval rights',
        level: 7,
        category: 'financial',
        isSystem: false,
    },
    {
        name: 'Gerente Operaciones',
        description: 'Operations Manager - Manages operations and projects',
        level: 7,
        category: 'operational',
        isSystem: false,
    },

    // Level 6: Mid-Level Management
    {
        name: 'Contador',
        description: 'Accountant - Financial data entry and reporting',
        level: 6,
        category: 'financial',
        isSystem: false,
    },
    {
        name: 'Supervisor',
        description: 'Supervisor - Oversees teams and projects',
        level: 6,
        category: 'operational',
        isSystem: false,
    },

    // Level 5: Project Management
    {
        name: 'Project Manager',
        description: 'Project Manager - Manages assigned projects',
        level: 5,
        category: 'operational',
        isSystem: false,
    },

    // Level 4: Team Leadership
    {
        name: 'Team Lead',
        description: 'Team Lead - Leads a team of developers/operators',
        level: 4,
        category: 'operational',
        isSystem: false,
    },

    // Level 3: Base Users
    {
        name: 'Developer',
        description: 'Developer - Works on assigned tasks',
        level: 3,
        category: 'base',
        isSystem: false,
    },
    {
        name: 'Operario',
        description: 'Operator - Executes operational tasks',
        level: 3,
        category: 'base',
        isSystem: false,
    },
];

async function main() {
    console.log(`🚀 Starting Role Normalization for Org: ${ORGANIZATION_ID}`);

    // 1. Upsert Canonical Roles
    console.log('\n📦 Upserting Canonical Roles...');
    const roleMap = new Map<string, string>(); // Name -> ID

    for (const roleData of ROLES) {
        const role = await prisma.role.upsert({
            where: {
                name_organizationId: {
                    name: roleData.name,
                    organizationId: ORGANIZATION_ID,
                },
            },
            update: {
                description: roleData.description,
                level: roleData.level,
                category: roleData.category,
                isSystem: roleData.isSystem,
            },
            create: {
                name: roleData.name,
                description: roleData.description,
                level: roleData.level,
                category: roleData.category,
                isSystem: roleData.isSystem,
                organizationId: ORGANIZATION_ID,
            },
        });
        roleMap.set(role.name, role.id);
        console.log(`   ✅ ${role.name} (ID: ${role.id})`);
    }

    // 2. Normalize Users
    console.log('\n👥 Normalizing Users...');
    const users = await prisma.user.findMany({
        where: { organizationId: ORGANIZATION_ID },
        include: { role: true },
    });

    console.log(`   Found ${users.length} users.`);

    for (const user of users) {
        let targetRoleName = 'Developer'; // Default fallback
        const currentRoleName = user.role?.name;

        // Mapping Logic
        if (currentRoleName) {
            // Exact match
            if (roleMap.has(currentRoleName)) {
                console.log(`   🔹 User ${user.email} already has valid role: ${currentRoleName}`);
                continue;
            }

            // Fuzzy / Legacy Mapping
            const lower = currentRoleName.toLowerCase();
            if (lower.includes('admin') || lower.includes('ceo')) targetRoleName = 'Superadmin'; // Or CEO
            else if (lower.includes('finance') || lower.includes('cfo')) targetRoleName = 'CFO';
            else if (lower.includes('contador')) targetRoleName = 'Contador';
            else if (lower.includes('manager') || lower.includes('gerente')) targetRoleName = 'Project Manager';
            else if (lower.includes('lead')) targetRoleName = 'Team Lead';
            else if (lower.includes('oper')) targetRoleName = 'Operario';
        }

        // Special Case: Admin email from prompt
        if (user.email === 'admin@acme.com') {
            targetRoleName = 'Superadmin';
        }

        const targetRoleId = roleMap.get(targetRoleName);
        if (!targetRoleId) {
            console.error(`   ❌ CRITICAL: Target role ${targetRoleName} not found in map!`);
            continue;
        }

        if (user.roleId !== targetRoleId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { roleId: targetRoleId },
            });
            console.log(`   ✏️  Updated ${user.email}: ${currentRoleName || 'None'} -> ${targetRoleName}`);
        }
    }

    console.log('\n✅ Role Normalization Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
