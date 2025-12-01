import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Accounts Payable ---');

    // Search for the AP mentioned by the user: "testing"
    const aps = await prisma.accountPayable.findMany({
        where: {
            concepto: {
                contains: 'testing',
                mode: 'insensitive'
            }
        },
        include: {
            supplier: true
        }
    });

    console.log(`Found ${aps.length} APs matching "testing":`);

    for (const ap of aps) {
        console.log(`\nAP ID: ${ap.id}`);
        console.log(`Concept: ${ap.concepto}`);
        console.log(`Supplier: ${ap.supplier?.nombre}`);
        console.log(`Total Amount: ${ap.monto}`);
        console.log(`Paid Amount: ${ap.montoPagado}`);
        console.log(`Remaining Amount: ${ap.montoRestante}`);
        console.log(`Status: ${ap.status}`);
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
