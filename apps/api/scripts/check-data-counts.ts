
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking data counts...\n');

    try {
        const counts = {
            clients: await prisma.client.count(),
            projects: await prisma.project.count(),
            suppliers: await prisma.supplier.count(),
            accountsPayable: await prisma.accountPayable.count(),
            accountsReceivable: await prisma.accountReceivable.count(),
            fixedCosts: await prisma.fixedCost.count(),
            journalEntries: await prisma.journalEntry.count(),
            invoices: await prisma.invoice.count(),
            purchaseOrders: await prisma.purchaseOrder.count(),
            requisitions: await prisma.requisition.count(),
            flowRecoveries: await prisma.flowRecovery.count(),
            accounts: await prisma.account.count(), // Plan de cuentas
            categories: await prisma.category.count(),
            phases: await prisma.phase.count(),
        };

        console.table(counts);

    } catch (error) {
        console.error('❌ Error checking counts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
