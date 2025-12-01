import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataByOrg() {
    console.log('🔍 Checking data distribution by organization...\n');

    try {
        const acmeOrg = await prisma.organization.findFirst({
            where: { name: 'Acme Corporation' }
        });

        if (!acmeOrg) {
            console.error('❌ Acme Corporation not found');
            return;
        }

        console.log(`📊 Data for: ${acmeOrg.name} (${acmeOrg.id})\n`);

        // Clients
        const clients = await prisma.client.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`🏢 Clients: ${clients}`);

        // Suppliers
        const suppliers = await prisma.supplier.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`📦 Suppliers: ${suppliers}`);

        // Projects
        const projects = await prisma.project.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`📁 Projects: ${projects}`);

        // Invoices
        const invoices = await prisma.invoice.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`🧾 Invoices: ${invoices}`);

        // Accounts Receivable
        const accountsReceivable = await prisma.accountReceivable.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`💰 Accounts Receivable: ${accountsReceivable}`);

        // Accounts Payable
        const accountsPayable = await prisma.accountPayable.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`💸 Accounts Payable: ${accountsPayable}`);

        // Fixed Costs
        const fixedCosts = await prisma.fixedCost.count({
            where: { organizationId: acmeOrg.id }
        });
        console.log(`🔧 Fixed Costs: ${fixedCosts}`);

        console.log('\n✅ Count complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDataByOrg();
