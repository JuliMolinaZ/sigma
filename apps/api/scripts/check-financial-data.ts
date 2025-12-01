import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataCounts() {
    try {
        const counts = {
            accountsReceivable: await prisma.accountReceivable.count(),
            accountsPayable: await prisma.accountPayable.count(),
            fixedCosts: await prisma.fixedCost.count(),
            invoices: await prisma.invoice.count(),
            paymentComplements: await prisma.paymentComplement.count(),
            quotes: await prisma.quote.count(),
            recoveries: await prisma.recovery.count(),
            flowRecoveries: await prisma.flowRecovery.count(),
            journalEntries: await prisma.journalEntry.count(),
            accounts: await prisma.account.count(),
            clients: await prisma.client.count(),
            suppliers: await prisma.supplier.count(),
            categories: await prisma.category.count(),
            projects: await prisma.project.count(),
        };

        console.log('\n📊 CONTEO DE DATOS FINANCIEROS\n');
        console.log('═'.repeat(60));

        Object.entries(counts).forEach(([table, count]) => {
            const emoji = count > 0 ? '✅' : '❌';
            const tableName = table.replace(/([A-Z])/g, ' $1').trim();
            console.log(`${emoji} ${tableName.padEnd(25)} ${count.toString().padStart(5)} registros`);
        });

        console.log('═'.repeat(60));

        // Sample data from each table
        console.log('\n📋 MUESTRA DE DATOS\n');

        if (counts.accountsReceivable > 0) {
            const sample = await prisma.accountReceivable.findFirst({
                include: {
                    project: { select: { name: true } },
                    client: { select: { nombre: true } },
                },
            });
            console.log('\n💰 Cuenta por Cobrar (muestra):');
            console.log(JSON.stringify(sample, null, 2));
        }

        if (counts.accountsPayable > 0) {
            const sample = await prisma.accountPayable.findFirst({
                include: {
                    supplier: { select: { nombre: true } },
                    category: { select: { nombre: true } },
                },
            });
            console.log('\n💳 Cuenta por Pagar (muestra):');
            console.log(JSON.stringify(sample, null, 2));
        }

        if (counts.invoices > 0) {
            const sample = await prisma.invoice.findFirst({
                include: {
                    client: { select: { nombre: true } },
                },
            });
            console.log('\n🧾 Factura (muestra):');
            console.log(JSON.stringify(sample, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDataCounts();
