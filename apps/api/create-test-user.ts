import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
    console.log('🔧 Resetting admin password...\n');

    try {
        // Find the admin user in Acme Corporation with permissions
        const adminUser = await prisma.user.findFirst({
            where: {
                email: 'admin@sigma.com',
                organization: {
                    name: 'Acme Corporation'
                }
            },
            include: {
                organization: true,
                role: true
            }
        });

        if (!adminUser) {
            console.error('❌ Admin user not found in Acme Corporation');
            return;
        }

        // Hash the new password
        const newPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await prisma.user.update({
            where: { id: adminUser.id },
            data: { password: hashedPassword }
        });

        console.log('✅ Password reset successfully!\n');
        console.log('📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:        ${adminUser.email}`);
        console.log(`Password:     ${newPassword}`);
        console.log(`Organization: ${adminUser.organization.name}`);
        console.log(`Org ID:       ${adminUser.organizationId}`);
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

resetAdminPassword();
