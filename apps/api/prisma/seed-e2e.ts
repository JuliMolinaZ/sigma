import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting E2E Seeding...');

    // 1. Clean up (optional, but good for idempotency if we delete by email)
    // We won't delete everything to avoid wiping existing data if any, but we'll upsert.

    // 2. Create Organizations
    const orgA = await prisma.organization.upsert({
        where: { slug: 'org-a' },
        update: {},
        create: {
            name: 'Organization A',
            slug: 'org-a',
        },
    });
    console.log(`✅ Organization A created: ${orgA.id}`);

    const orgB = await prisma.organization.upsert({
        where: { slug: 'org-b' },
        update: {},
        create: {
            name: 'Organization B',
            slug: 'org-b',
        },
    });
    console.log(`✅ Organization B created: ${orgB.id}`);

    // 3. Create Roles for Org A
    const roles = [
        { name: 'Superadmin', level: 10, category: 'executive' },
        { name: 'CFO', level: 8, category: 'financial' },
        { name: 'CTO', level: 8, category: 'technical' },
        { name: 'PM', level: 5, category: 'operational' },
        { name: 'Developer', level: 3, category: 'technical' },
    ];

    const roleMap: Record<string, string> = {};

    for (const r of roles) {
        const role = await prisma.role.upsert({
            where: { name_organizationId: { name: r.name, organizationId: orgA.id } },
            update: {},
            create: {
                name: r.name,
                level: r.level,
                category: r.category,
                organizationId: orgA.id,
            },
        });
        roleMap[r.name] = role.id;
        console.log(`   Role ${r.name} created.`);
    }

    // Create Superadmin for Org B
    const roleOrgB = await prisma.role.upsert({
        where: { name_organizationId: { name: 'Superadmin', organizationId: orgB.id } },
        update: {},
        create: {
            name: 'Superadmin',
            level: 10,
            category: 'executive',
            organizationId: orgB.id,
        },
    });

    // 4. Create Users
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users = [
        { email: 'admin@sigma.com', role: 'Superadmin', firstName: 'Admin', lastName: 'User', orgId: orgA.id, roleId: roleMap['Superadmin'] },
        { email: 'cfo@sigma.com', role: 'CFO', firstName: 'CFO', lastName: 'User', orgId: orgA.id, roleId: roleMap['CFO'] },
        { email: 'cto@sigma.com', role: 'CTO', firstName: 'CTO', lastName: 'User', orgId: orgA.id, roleId: roleMap['CTO'] },
        { email: 'pm@sigma.com', role: 'PM', firstName: 'PM', lastName: 'User', orgId: orgA.id, roleId: roleMap['PM'] },
        { email: 'dev@sigma.com', role: 'Developer', firstName: 'Dev', lastName: 'User', orgId: orgA.id, roleId: roleMap['Developer'] },
        { email: 'user@orgb.com', role: 'Superadmin', firstName: 'OrgB', lastName: 'User', orgId: orgB.id, roleId: roleOrgB.id },
    ];

    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { email_organizationId: { email: u.email, organizationId: u.orgId } },
            update: {
                password: passwordHash,
                roleId: u.roleId,
            },
            create: {
                email: u.email,
                password: passwordHash,
                firstName: u.firstName,
                lastName: u.lastName,
                organizationId: u.orgId,
                roleId: u.roleId,
            },
        });
        console.log(`👤 User ${u.email} (${u.role}) ready.`);
    }

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
