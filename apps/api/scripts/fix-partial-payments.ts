/**
 * Script para corregir pagos parciales en cuentas por pagar y cuentas por cobrar
 * 
 * Este script:
 * 1. Recalcula montoPagado y montoRestante basándose en payment_complements
 * 2. Actualiza el status a PARTIAL o PAID según corresponda
 * 3. Asegura que los datos estén sincronizados
 */

import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPartialPayments() {
    console.log('🔍 Iniciando corrección de pagos parciales...\n');

    try {
        // 1. Corregir cuentas por cobrar (Accounts Receivable)
        console.log('📊 Corrigiendo cuentas por cobrar...');
        const accountsReceivable = await prisma.accountReceivable.findMany({
            include: {
                paymentComplements: {
                    orderBy: { fechaPago: 'asc' },
                },
            },
        });

        let arFixed = 0;
        for (const ar of accountsReceivable) {
            const totalPaid = ar.paymentComplements.reduce(
                (sum, pc) => sum + Number(pc.monto),
                0
            );
            const remaining = Number(ar.monto) - totalPaid;

            // Determinar status
            let newStatus: PaymentStatus = 'PENDING';
            if (totalPaid > 0 && remaining > 0.01) {
                newStatus = 'PARTIAL';
            } else if (remaining <= 0.01) {
                newStatus = 'PAID';
            }

            // Solo actualizar si hay diferencia
            if (
                Number(ar.montoPagado) !== totalPaid ||
                Number(ar.montoRestante) !== remaining ||
                ar.status !== newStatus
            ) {
                await prisma.accountReceivable.update({
                    where: { id: ar.id },
                    data: {
                        montoPagado: totalPaid,
                        montoRestante: remaining,
                        status: newStatus,
                    },
                });
                arFixed++;
                console.log(
                    `  ✅ AR ${ar.id.substring(0, 8)}... - Pagado: ${totalPaid.toFixed(2)}, Restante: ${remaining.toFixed(2)}, Status: ${newStatus}`
                );
            }
        }

        console.log(`\n✅ Cuentas por cobrar corregidas: ${arFixed} de ${accountsReceivable.length}\n`);

        // 2. Corregir cuentas por pagar (Accounts Payable)
        console.log('📊 Corrigiendo cuentas por pagar...');
        const accountsPayable = await prisma.accountPayable.findMany({
            include: {
                paymentComplements: {
                    orderBy: { fechaPago: 'asc' },
                },
            },
        });

        let apFixed = 0;
        for (const ap of accountsPayable) {
            const totalPaid = ap.paymentComplements.reduce(
                (sum, pc) => sum + Number(pc.monto),
                0
            );
            const remaining = Number(ap.monto) - totalPaid;

            // Determinar status
            let newStatus: PaymentStatus = 'PENDING';
            if (totalPaid > 0 && remaining > 0.01) {
                newStatus = 'PARTIAL';
            } else if (remaining <= 0.01) {
                newStatus = 'PAID';
            }

            // Solo actualizar si hay diferencia
            if (
                Number(ap.montoPagado) !== totalPaid ||
                (ap.montoRestante !== null && Number(ap.montoRestante) !== remaining) ||
                ap.status !== newStatus
            ) {
                await prisma.accountPayable.update({
                    where: { id: ap.id },
                    data: {
                        montoPagado: totalPaid,
                        montoRestante: remaining,
                        status: newStatus,
                        pagado: newStatus === 'PAID',
                    },
                });
                apFixed++;
                console.log(
                    `  ✅ AP ${ap.id.substring(0, 8)}... - Pagado: ${totalPaid.toFixed(2)}, Restante: ${remaining.toFixed(2)}, Status: ${newStatus}`
                );
            }
        }

        console.log(`\n✅ Cuentas por pagar corregidas: ${apFixed} de ${accountsPayable.length}\n`);

        // 3. Resumen
        console.log('📈 Resumen:');
        console.log(`   - Cuentas por cobrar: ${arFixed} actualizadas`);
        console.log(`   - Cuentas por pagar: ${apFixed} actualizadas`);
        console.log(`   - Total: ${arFixed + apFixed} cuentas corregidas\n`);

        // 4. Verificar pagos parciales
        const partialAR = await prisma.accountReceivable.count({
            where: { status: 'PARTIAL' },
        });
        const partialAP = await prisma.accountPayable.count({
            where: { status: 'PARTIAL' },
        });

        console.log('📊 Estado final:');
        console.log(`   - Cuentas por cobrar con pagos parciales: ${partialAR}`);
        console.log(`   - Cuentas por pagar con pagos parciales: ${partialAP}`);
        console.log(`   - Total de pagos parciales: ${partialAR + partialAP}\n`);

        console.log('✅ Corrección completada exitosamente!');
    } catch (error) {
        console.error('❌ Error al corregir pagos parciales:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
fixPartialPayments()
    .then(() => {
        console.log('\n✨ Script ejecutado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error ejecutando el script:', error);
        process.exit(1);
    });
