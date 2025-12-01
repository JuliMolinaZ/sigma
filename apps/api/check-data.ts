import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('🔍 Checking database data...\n');

    try {
        // Check Organizations
        const orgs = await prisma.organization.findMany();
        console.log(`📊 Organizations: ${orgs.length}`);
        orgs.forEach(org => {
            console.log(`   - ${org.name} (${org.id}) - Active: ${org.isActive}`);
        });

        // Check Users
        const users = await prisma.user.findMany({
            include: {
                role: true,
                organization: true,
            }
        });
        console.log(`\n👥 Users: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
            console.log(`     Org: ${user.organization.name}, Role: ${user.role.name}`);
        });

        // Check Clients
        const clients = await prisma.client.findMany({
            include: {
                organization: true,
            }
        });
        console.log(`\n🏢 Clients: ${clients.length}`);
        clients.forEach(client => {
            console.log(`   - ${client.nombre} (${client.id})`);
            console.log(`     Org: ${client.organization.name}, Active: ${client.isActive}`);
        });

        // Check Suppliers
        const suppliers = await prisma.supplier.findMany({
            include: {
                organization: true,
            }
        });
        console.log(`\n📦 Suppliers: ${suppliers.length}`);
        suppliers.forEach(supplier => {
            console.log(`   - ${supplier.nombre} (${supplier.id})`);
            console.log(`     Org: ${supplier.organization.name}, Active: ${supplier.isActive}`);
        });

        // Check Projects
        const projects = await prisma.project.findMany({
            include: {
                organization: true,
                client: true,
            }
        });
        console.log(`\n📁 Projects: ${projects.length}`);
        projects.forEach(project => {
            console.log(`   - ${project.name} (${project.id})`);
            console.log(`     Org: ${project.organization.name}, Status: ${project.status}`);
            if (project.client) {
                console.log(`     Client: ${project.client.nombre}`);
            }
        });

        // Check Invoices
        const invoices = await prisma.invoice.findMany({
            include: {
                organization: true,
                client: true,
            }
        });
        console.log(`\n🧾 Invoices: ${invoices.length}`);
        invoices.forEach(invoice => {
            console.log(`   - ${invoice.number} - $${invoice.amount}`);
            console.log(`     Org: ${invoice.organization.name}, Status: ${invoice.status}`);
        });

        // Check Accounts Receivable
        const accountsReceivable = await prisma.accountReceivable.findMany({
            include: {
                organization: true,
                client: true,
            }
        });
        console.log(`\n💰 Accounts Receivable: ${accountsReceivable.length}`);
        accountsReceivable.forEach(ar => {
            console.log(`   - ${ar.concepto} - $${ar.monto}`);
            console.log(`     Org: ${ar.organization.name}, Status: ${ar.status}`);
        });

        // Check Accounts Payable
        const accountsPayable = await prisma.accountPayable.findMany({
            include: {
                organization: true,
                supplier: true,
            }
        });
        console.log(`\n💸 Accounts Payable: ${accountsPayable.length}`);
        accountsPayable.forEach(ap => {
            console.log(`   - ${ap.concepto} - $${ap.monto}`);
            console.log(`     Org: ${ap.organization.name}, Status: ${ap.status}`);
        });

        // Check Fixed Costs
        const fixedCosts = await prisma.fixedCost.findMany({
            include: {
                organization: true,
            }
        });
        console.log(`\n🔧 Fixed Costs: ${fixedCosts.length}`);
        fixedCosts.forEach(fc => {
            console.log(`   - ${fc.nombre} - $${fc.monto}`);
            console.log(`     Org: ${fc.organization.name}, Frequency: ${fc.periodicidad}`);
        });

        console.log('\n✅ Data check complete!');

    } catch (error) {
        console.error('❌ Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
