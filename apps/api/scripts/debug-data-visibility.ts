import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORGANIZATION_ID = '0b0ed7dd-3277-4980-9497-18b0fe7e7e62';

async function main() {
    console.log(`🔍 Starting Data Visibility Debug for Org: ${ORGANIZATION_ID}`);

    // 1. Check Clients
    console.log('\n👥 Checking Clients...');
    const totalClients = await prisma.client.count();
    const orgClients = await prisma.client.count({ where: { organizationId: ORGANIZATION_ID } });
    const activeOrgClients = await prisma.client.count({ where: { organizationId: ORGANIZATION_ID, isActive: true } });

    console.log(`   Total Clients in DB: ${totalClients}`);
    console.log(`   Clients for Org: ${orgClients}`);
    console.log(`   Active Clients for Org: ${activeOrgClients}`);

    if (orgClients > 0) {
        const sample = await prisma.client.findMany({
            where: { organizationId: ORGANIZATION_ID },
            take: 3,
            select: { id: true, nombre: true, isActive: true, organizationId: true }
        });
        console.log('   Sample Clients:', JSON.stringify(sample, null, 2));
    }

    // 2. Check Accounts Payable
    console.log('\n💰 Checking Accounts Payable...');
    const totalAP = await prisma.accountPayable.count();
    const orgAP = await prisma.accountPayable.count({ where: { organizationId: ORGANIZATION_ID } });

    console.log(`   Total AP in DB: ${totalAP}`);
    console.log(`   AP for Org: ${orgAP}`);

    if (totalAP > 0 && orgAP === 0) {
        console.log('   ⚠️  Mismatch detected! Checking first 3 AP records to see their Org ID...');
        const sampleAP = await prisma.accountPayable.findMany({
            take: 3,
            select: { id: true, concepto: true, organizationId: true }
        });
        console.log('   Sample AP Records:', JSON.stringify(sampleAP, null, 2));
    }

    console.log('\n✅ Debug Complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
