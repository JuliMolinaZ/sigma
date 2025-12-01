
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

        console.log(`Checking Accounts Receivable for organization: ${targetOrg.name} (${targetOrg.id})`);

        const ars: any[] = await prisma.$queryRaw`
            SELECT id, concepto, monto, "fecha_vencimiento", "monto_pagado", "monto_restante", status 
            FROM "accounts_receivable" 
            WHERE organization_id = ${targetOrg.id} 
            LIMIT 10
        `;

        console.log('Sample Accounts Receivable Records:');
        ars.forEach(ar => {
            console.log({
                id: ar.id,
                concepto: ar.concepto,
                monto: ar.monto,
                fechaVencimiento: ar.fecha_vencimiento,
                montoPagado: ar.monto_pagado,
                montoRestante: ar.monto_restante,
                status: ar.status
            });
        });

    } catch (error) {
        console.error('Error checking ARs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
