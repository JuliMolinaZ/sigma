import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixAdminUser() {
    console.log('🔧 Fixing admin user for Acme Corporation...\n');

    try {
        // Find Acme Corporation
        const acmeOrg = await prisma.organization.findFirst({
            where: { name: 'Acme Corporation' }
        });

        if (!acmeOrg) {
            console.error('❌ Acme Corporation not found');
            return;
        }

        // Find the admin user in Acme Corporation
        const adminUser = await prisma.user.findFirst({
            where: {
                email: 'admin@sigma.com',
                organizationId: acmeOrg.id
            },
            include: {
                role: true
            }
        });

        if (!adminUser) {
            console.error('❌ Admin user not found in Acme Corporation');
            return;
        }

        // Update email to be unique and reset password
        const newEmail = 'admin@acme.com';
        const newPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                email: newEmail,
                password: hashedPassword
            }
        });

        console.log('✅ Admin user updated successfully!\n');
        console.log('📋 Login Credentials for Acme Corporation:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:        ${newEmail}`);
        console.log(`Password:     ${newPassword}`);
        console.log(`Organization: ${acmeOrg.name}`);
        console.log(`Org ID:       ${acmeOrg.id}`);
        console.log(`Role:         ${adminUser.role.name} (Level ${adminUser.role.level})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🌐 Frontend URL: http://localhost:3001');
        console.log('📚 API Docs:     http://localhost:3000/api/docs\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminUser();
