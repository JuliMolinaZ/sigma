import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPaymentComplements() {
    console.log('\n💸 VERIFICAR Y ACTUALIZAR COMPLEMENTOS DE PAGO\n');
    console.log('═'.repeat(60));

    try {
        // 1. Obtener todas las cuentas por cobrar con complementos
        console.log('\n📋 Paso 1: Obteniendo cuentas por cobrar...');

        const accountsReceivable = await prisma.accountReceivable.findMany({
            include: {
                paymentComplements: true,
            },
        });

        console.log(`   Total de cuentas por cobrar: ${accountsReceivable.length}`);

        // 2. Verificar y actualizar montos
        console.log('\n📋 Paso 2: Verificando complementos de pago...');

        let updatedCount = 0;
        let correctCount = 0;
        const discrepancies: Array<{
            arId: string;
            concepto: string;
            montoTotal: number;
            montoPagadoActual: number;
            montoPagadoCalculado: number;
            diferencia: number;
        }> = [];

        for (const ar of accountsReceivable) {
            const montoTotal = parseFloat(ar.monto.toString());
            const montoPagadoActual = parseFloat(ar.montoPagado.toString());

            // Calcular suma de complementos
            const montoPagadoCalculado = ar.paymentComplements.reduce(
                (sum, complement) => sum + parseFloat(complement.monto.toString()),
                0
            );

            const montoRestanteCalculado = montoTotal - montoPagadoCalculado;

            // Verificar si hay discrepancia
            if (Math.abs(montoPagadoActual - montoPagadoCalculado) > 0.01) {
                discrepancies.push({
                    arId: ar.id,
                    concepto: ar.concepto,
                    montoTotal,
                    montoPagadoActual,
                    montoPagadoCalculado,
                    diferencia: montoPagadoCalculado - montoPagadoActual,
                });

                // Actualizar montos
                await prisma.accountReceivable.update({
                    where: { id: ar.id },
                    data: {
                        montoPagado: montoPagadoCalculado,
                        montoRestante: montoRestanteCalculado,
                    },
                });

                updatedCount++;
            } else {
                correctCount++;
            }

            // Actualizar status según pagos
            let newStatus = ar.status;

            if (montoPagadoCalculado === 0) {
                newStatus = 'PENDING';
            } else if (montoPagadoCalculado >= montoTotal) {
                newStatus = 'PAID';
            } else if (montoPagadoCalculado > 0 && montoPagadoCalculado < montoTotal) {
                newStatus = 'PARTIAL';
            }

            // Verificar si está vencida
            if (ar.fechaVencimiento && new Date(ar.fechaVencimiento) < new Date() && newStatus !== 'PAID') {
                newStatus = 'OVERDUE';
            }

            // Actualizar status si cambió
            if (newStatus !== ar.status) {
                await prisma.accountReceivable.update({
                    where: { id: ar.id },
                    data: { status: newStatus },
                });
            }
        }

        console.log(`   ✅ Cuentas correctas: ${correctCount}`);
        console.log(`   🔧 Cuentas actualizadas: ${updatedCount}`);

        // 3. Mostrar discrepancias
        if (discrepancies.length > 0) {
            console.log('\n📋 Discrepancias encontradas y corregidas:');
            discrepancies.slice(0, 10).forEach((disc, index) => {
                console.log(`\n   ${index + 1}. ${disc.concepto}`);
                console.log(`      Monto Total: $${disc.montoTotal.toFixed(2)}`);
                console.log(`      Pagado (anterior): $${disc.montoPagadoActual.toFixed(2)}`);
                console.log(`      Pagado (calculado): $${disc.montoPagadoCalculado.toFixed(2)}`);
                console.log(`      Diferencia: $${disc.diferencia.toFixed(2)}`);
            });

            if (discrepancies.length > 10) {
                console.log(`\n   ... y ${discrepancies.length - 10} más`);
            }
        }

        // 4. Estadísticas de complementos
        console.log('\n📋 Paso 3: Estadísticas de complementos de pago...');

        const totalComplements = await prisma.paymentComplement.count();
        const arWithComplements = accountsReceivable.filter(ar => ar.paymentComplements.length > 0).length;
        const arWithoutComplements = accountsReceivable.length - arWithComplements;

        console.log(`   Total de complementos: ${totalComplements}`);
        console.log(`   Cuentas con complementos: ${arWithComplements}`);
        console.log(`   Cuentas sin complementos: ${arWithoutComplements}`);
        console.log(`   Promedio de complementos por cuenta: ${(totalComplements / arWithComplements).toFixed(2)}`);

        // 5. Resumen por status
        console.log('\n📋 Paso 4: Resumen por estado...');

        const statusCounts = await prisma.accountReceivable.groupBy({
            by: ['status'],
            _count: true,
            _sum: {
                monto: true,
                montoPagado: true,
                montoRestante: true,
            },
        });

        statusCounts.forEach(status => {
            console.log(`\n   ${status.status}:`);
            console.log(`      Cantidad: ${status._count}`);
            console.log(`      Monto Total: $${parseFloat(status._sum.monto?.toString() || '0').toFixed(2)}`);
            console.log(`      Pagado: $${parseFloat(status._sum.montoPagado?.toString() || '0').toFixed(2)}`);
            console.log(`      Restante: $${parseFloat(status._sum.montoRestante?.toString() || '0').toFixed(2)}`);
        });

        // 6. Resumen final
        console.log('\n📊 RESUMEN FINAL\n');
        console.log('═'.repeat(60));

        const totalMonto = accountsReceivable.reduce((sum, ar) => sum + parseFloat(ar.monto.toString()), 0);
        const totalPagado = accountsReceivable.reduce((sum, ar) => sum + parseFloat(ar.montoPagado.toString()), 0);
        const totalRestante = accountsReceivable.reduce((sum, ar) => sum + parseFloat(ar.montoRestante.toString()), 0);

        console.log(`✅ Total por cobrar: $${totalMonto.toFixed(2)}`);
        console.log(`✅ Total pagado: $${totalPagado.toFixed(2)} (${((totalPagado / totalMonto) * 100).toFixed(1)}%)`);
        console.log(`⚠️  Total restante: $${totalRestante.toFixed(2)} (${((totalRestante / totalMonto) * 100).toFixed(1)}%)`);

        console.log('\n✅ Verificación de complementos completada!\n');

    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar script
verifyPaymentComplements()
    .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script falló:', error);
        process.exit(1);
    });
