import { PrismaClient } from '@prisma/client';

/**
 * Enterprise Role Seeds
 * 
 * Seeds the specific roles requested by the user with hierarchy levels and categories
 */

export async function seedEnterpriseRoles(prisma: PrismaClient, organizationId: string) {
    const roles = [
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

        // Level 8: Department Heads
        {
            name: 'CFO',
            description: 'Chief Financial Officer - Full financial access',
            level: 8,
            category: 'financial',
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

    const createdRoles = [];

    for (const roleData of roles) {
        const role = await prisma.role.upsert({
            where: {
                name_organizationId: {
                    name: roleData.name,
                    organizationId,
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
                organizationId,
            },
        });

        createdRoles.push(role);
        console.log(`✅ Created/Updated role: ${role.name} (Level ${role.level})`);
    }

    return createdRoles;
}

/**
 * Role Hierarchy Helper
 */
export const ROLE_HIERARCHY = {
    'Superadmin': 10,
    'CEO': 9,
    'CFO': 8,
    'Contador Senior': 7,
    'Gerente Operaciones': 7,
    'Supervisor': 6,
    'Project Manager': 5,
    'Developer': 3,
    'Operario': 3,
};

/**
 * Financial Roles (have access to financial data)
 */
export const FINANCIAL_ROLES = [
    'Superadmin',
    'CEO',
    'CFO',
    'Contador Senior',
];

/**
 * Technical Roles (have access to technical modules)
 */
export const TECHNICAL_ROLES = [
    'Superadmin',
    'Developer',
];

/**
 * Operational Roles (have access to operations)
 */
export const OPERATIONAL_ROLES = [
    'Superadmin',
    'CEO',
    'Gerente Operaciones',
    'Supervisor',
    'Project Manager',
    'Developer',
    'Operario',
];
