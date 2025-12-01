
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Find RUNITE Legacy organization
        const orgs: any[] = await prisma.$queryRaw`SELECT * FROM "organizations" WHERE name = 'RUNITE Legacy' LIMIT 1`;
        const targetOrg = orgs[0];

        if (!targetOrg) {
            console.error('Target organization "RUNITE Legacy" not found!');
            return;
        }

        console.log(`Checking Accounts Payable for organization: ${targetOrg.name} (${targetOrg.id})`);

        const aps: any[] = await prisma.$queryRaw`
            SELECT id, concepto, monto, "fecha_vencimiento", "monto_pagado", "monto_restante", status, pagado 
            FROM "accounts_payable" 
            WHERE organization_id = ${targetOrg.id} 
            LIMIT 10
        `;

        console.log('Sample Accounts Payable Records:');
        aps.forEach(ap => {
            console.log({
                id: ap.id,
                concepto: ap.concepto,
                monto: ap.monto,
                fechaVencimiento: ap.fecha_vencimiento,
                montoPagado: ap.monto_pagado,
                montoRestante: ap.monto_restante,
                status: ap.status,
                pagado: ap.pagado
            });
        });

    } catch (error) {
        console.error('Error checking APs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
