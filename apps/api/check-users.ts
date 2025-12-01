import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    console.log('🔍 Checking users and authentication setup...\n');

    try {
        const users = await prisma.user.findMany({
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                organization: true,
            }
        });

        console.log(`Found ${users.length} users:\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Organization: ${user.organization.name} (${user.organizationId})`);
            console.log(`   Role: ${user.role.name} (Level: ${user.role.level})`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Permissions: ${user.role.permissions.length} permissions`);

            if (user.role.permissions.length > 0) {
                console.log(`   Sample permissions:`);
                user.role.permissions.slice(0, 5).forEach(rp => {
                    console.log(`     - ${rp.permission.resource}:${rp.permission.action}`);
                });
                if (user.role.permissions.length > 5) {
                    console.log(`     ... and ${user.role.permissions.length - 5} more`);
                }
            }
            console.log('');
        });

        // Check if there's an admin user
        const adminUser = users.find(u =>
            u.role.name.toLowerCase().includes('admin') ||
            u.role.level >= 8
        );

        if (adminUser) {
            console.log(`\n✅ Found admin user: ${adminUser.email}`);
            console.log(`   You can use this email to login to the frontend`);
            console.log(`   Organization ID: ${adminUser.organizationId}`);
        } else {
            console.log(`\n⚠️  No admin user found. You may need to create one.`);
        }

        // Check organizations
        const orgs = await prisma.organization.findMany();
        console.log(`\n📊 Organizations:`);
        orgs.forEach(org => {
            console.log(`   - ${org.name} (ID: ${org.id}, Slug: ${org.slug})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
