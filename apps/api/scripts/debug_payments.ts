import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Payment Complements ---');

    // 1. List all ARs with montoPagado > 0
    const ars = await prisma.accountReceivable.findMany({
        where: {
            montoPagado: {
                gt: 0
            }
        },
        include: {
            paymentComplements: true,
            client: true
        }
    });

    console.log(`Found ${ars.length} ARs with payments:`);

    for (const ar of ars) {
        console.log(`\nAR ID: ${ar.id}`);
        console.log(`Concept: ${ar.concepto}`);
        console.log(`Client: ${ar.client?.nombre}`);
        console.log(`Total Amount: ${ar.monto}`);
        console.log(`Paid Amount (AR Field): ${ar.montoPagado}`);
        console.log(`Remaining Amount (AR Field): ${ar.montoRestante}`);
        console.log(`Payment Complements Count: ${ar.paymentComplements.length}`);

        if (ar.paymentComplements.length > 0) {
            console.log('Payments:');
            ar.paymentComplements.forEach(p => {
                console.log(`  - ID: ${p.id}, Amount: ${p.monto}, Date: ${p.fechaPago}`);
            });
        } else {
            console.log('  No PaymentComplement records found.');
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
