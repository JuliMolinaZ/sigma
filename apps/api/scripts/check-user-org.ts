import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The Org ID we know has data (from previous debug)
const TARGET_ORG_ID = '0b0ed7dd-3277-4980-9497-18b0fe7e7e62';

async function main() {
    console.log('🔍 Checking User-Organization Mapping...\n');

    // 1. Check Data Organization
    const clientCount = await prisma.client.count({ where: { organizationId: TARGET_ORG_ID } });
    console.log(`📊 Data Check: Org ${TARGET_ORG_ID} has ${clientCount} clients.`);

    // 2. Check Users
    const emailsToCheck = ['admin@acme.com', 'j.molina@runsolutions-services.com', 'admin@sigma.com'];

    for (const email of emailsToCheck) {
        const user = await prisma.user.findFirst({
            where: { email },
            include: { organization: true, role: true }
        });

        if (user) {
            console.log(`\n👤 User: ${email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Org ID: ${user.organizationId}`);
            console.log(`   Org Name: ${user.organization?.name}`);
            console.log(`   Role: ${user.role?.name}`);

            if (user.organizationId !== TARGET_ORG_ID) {
                console.log(`   ⚠️  MISMATCH! User is in a different org than the data.`);
                console.log(`      User Org: ${user.organizationId}`);
                console.log(`      Data Org: ${TARGET_ORG_ID}`);

                // Auto-fix option?
                // await prisma.user.update({ where: { id: user.id }, data: { organizationId: TARGET_ORG_ID } });
                // console.log('      ✅ Fixed! User moved to correct org.');
            } else {
                console.log(`   ✅ MATCH! User is in the correct org.`);
            }
        } else {
            console.log(`\n❌ User not found: ${email}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
