#!/usr/bin/env ts-node

/**
 * Script para ligar los pagos migrados a las cuentas por cobrar/pagar
 * 
 * ⚠️  IMPORTANTE: Este script ACTUALIZA los montos de las cuentas
 * - Recalcula montoPagado sumando todos los PaymentComplements
 * - Recalcula montoRestante = monto - montoPagado
 * - Actualiza el status (PENDING/PARTIAL/PAID) según los pagos
 * 
 * Uso:
 *   ts-node scripts/link-payments-to-accounts.ts          # Modo simulación (dry-run)
 *   ts-node scripts/link-payments-to-accounts.ts --apply # Ejecutar actualización real
 */

import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Verificar si es modo simulación
const DRY_RUN = !process.argv.includes('--apply');

interface AccountUpdate {
    id: string;
    concepto: string;
    montoOriginal: number;
    montoPagadoActual: number;
    montoPagadoNuevo: number;
    montoRestanteNuevo: number;
    statusActual: PaymentStatus;
    statusNuevo: PaymentStatus;
    paymentCount: number;
}

async function processOrganization(organizationId: string, organizationName: string) {
    try {
        // ============================================
        // 1. ACTUALIZAR CUENTAS POR COBRAR (AR)
        // ============================================
        console.log('📊 Procesando Cuentas por Cobrar...\n');

        // ============================================
        // 1. ACTUALIZAR CUENTAS POR COBRAR (AR)
        // ============================================
        console.log('📊 Procesando Cuentas por Cobrar...\n');

        const allAR = await prisma.accountReceivable.findMany({
            where: { organizationId },
            include: {
                paymentComplements: true,
            },
        });

        const arUpdates: AccountUpdate[] = [];
        let arUpdated = 0;
        let arSkipped = 0;
        let arErrors = 0;

        for (const ar of allAR) {
            try {
                // Sumar todos los pagos
                const totalPaid = ar.paymentComplements.reduce(
                    (sum, payment) => sum + Number(payment.monto),
                    0
                );

                // Calcular monto restante
                const montoTotal = Number(ar.monto);
                const montoRestante = montoTotal - totalPaid;

                // Determinar nuevo status
                let newStatus: PaymentStatus = ar.status;
                if (montoRestante <= 0.01) {
                    // Epsilon para precisión de float
                    newStatus = 'PAID';
                } else if (totalPaid > 0.01) {
                    newStatus = 'PARTIAL';
                } else {
                    newStatus = 'PENDING';
                }

                // Verificar si hay cambios
                const currentPaid = Number(ar.montoPagado);
                const currentRemaining = Number(ar.montoRestante);
                const hasChanges =
                    Math.abs(currentPaid - totalPaid) > 0.01 ||
                    Math.abs(currentRemaining - montoRestante) > 0.01 ||
                    ar.status !== newStatus;

                if (hasChanges) {
                    arUpdates.push({
                        id: ar.id,
                        concepto: ar.concepto,
                        montoOriginal: montoTotal,
                        montoPagadoActual: currentPaid,
                        montoPagadoNuevo: totalPaid,
                        montoRestanteNuevo: montoRestante,
                        statusActual: ar.status,
                        statusNuevo: newStatus,
                        paymentCount: ar.paymentComplements.length,
                    });

                    if (!DRY_RUN) {
                        await prisma.accountReceivable.update({
                            where: { id: ar.id },
                            data: {
                                montoPagado: totalPaid,
                                montoRestante: montoRestante,
                                status: newStatus,
                            },
                        });
                    }

                    arUpdated++;
                    console.log(
                        `✅ AR: ${ar.concepto.substring(0, 40)}... | Pagos: ${ar.paymentComplements.length} | Pagado: ${currentPaid.toFixed(2)} → ${totalPaid.toFixed(2)} | Status: ${ar.status} → ${newStatus}`
                    );
                } else {
                    arSkipped++;
                }
            } catch (error: any) {
                console.error(`❌ Error procesando AR ${ar.id}:`, error.message);
                arErrors++;
            }
        }

        // ============================================
        // 2. ACTUALIZAR CUENTAS POR PAGAR (AP)
        // ============================================
        console.log('\n📊 Procesando Cuentas por Pagar...\n');

        const allAP = await prisma.accountPayable.findMany({
            where: { organizationId },
            include: {
                paymentComplements: true,
            },
        });

        const apUpdates: AccountUpdate[] = [];
        let apUpdated = 0;
        let apSkipped = 0;
        let apErrors = 0;

        for (const ap of allAP) {
            try {
                // Sumar todos los pagos
                const totalPaid = ap.paymentComplements.reduce(
                    (sum, payment) => sum + Number(payment.monto),
                    0
                );

                // Calcular monto restante
                const montoTotal = Number(ap.monto);
                const montoRestante = montoTotal - totalPaid;

                // Determinar nuevo status
                let newStatus: PaymentStatus = ap.status;
                if (montoRestante <= 0.01) {
                    // Epsilon para precisión de float
                    newStatus = 'PAID';
                } else if (totalPaid > 0.01) {
                    newStatus = 'PARTIAL';
                } else {
                    newStatus = 'PENDING';
                }

                // Si no hay PaymentComplements pero hay montoPagado, preservar el valor existente
                // (probablemente fue registrado manualmente antes de la migración)
                let finalPaid = totalPaid;
                let finalRemaining = montoRestante;
                let finalStatus = newStatus;

                if (ap.paymentComplements.length === 0 && Number(ap.montoPagado) > 0.01) {
                    // Preservar valores existentes si no hay PaymentComplements
                    finalPaid = Number(ap.montoPagado);
                    finalRemaining = Number(ap.montoRestante || ap.monto) - finalPaid;
                    if (finalRemaining <= 0.01) {
                        finalStatus = 'PAID';
                    } else if (finalPaid > 0.01) {
                        finalStatus = 'PARTIAL';
                    } else {
                        finalStatus = 'PENDING';
                    }
                }

                // Verificar si hay cambios
                const currentPaid = Number(ap.montoPagado);
                const currentRemaining = Number(ap.montoRestante || ap.monto);
                const hasChanges =
                    Math.abs(currentPaid - finalPaid) > 0.01 ||
                    Math.abs(currentRemaining - finalRemaining) > 0.01 ||
                    ap.status !== finalStatus;

                if (hasChanges) {
                    apUpdates.push({
                        id: ap.id,
                        concepto: ap.concepto,
                        montoOriginal: montoTotal,
                        montoPagadoActual: currentPaid,
                        montoPagadoNuevo: finalPaid,
                        montoRestanteNuevo: finalRemaining,
                        statusActual: ap.status,
                        statusNuevo: finalStatus,
                        paymentCount: ap.paymentComplements.length,
                    });

                    if (!DRY_RUN) {
                        await prisma.accountPayable.update({
                            where: { id: ap.id },
                            data: {
                                montoPagado: finalPaid,
                                montoRestante: finalRemaining,
                                status: finalStatus,
                            },
                        });
                    }

                    apUpdated++;
                    const note = ap.paymentComplements.length === 0 && currentPaid > 0.01 ? ' (preservado)' : '';
                    console.log(
                        `✅ AP: ${ap.concepto.substring(0, 40)}... | Pagos: ${ap.paymentComplements.length} | Pagado: ${currentPaid.toFixed(2)} → ${finalPaid.toFixed(2)}${note} | Status: ${ap.status} → ${finalStatus}`
                    );
                } else {
                    apSkipped++;
                }
            } catch (error: any) {
                console.error(`❌ Error procesando AP ${ap.id}:`, error.message);
                apErrors++;
            }
        }

        // ============================================
        // RESUMEN
        // ============================================
        console.log('\n' + '='.repeat(60));
        console.log('📈 RESUMEN DE ACTUALIZACIÓN');
        console.log('='.repeat(60));

        console.log('\n💰 CUENTAS POR COBRAR (AR):');
        if (DRY_RUN) {
            console.log(`   🔍 [SIMULACIÓN] Se actualizarían: ${arUpdated}`);
        } else {
            console.log(`   ✅ Actualizadas: ${arUpdated}`);
        }
        console.log(`   ⏭️  Sin cambios: ${arSkipped}`);
        console.log(`   ❌ Errores: ${arErrors}`);
        console.log(`   📊 Total procesadas: ${allAR.length}`);

        console.log('\n💸 CUENTAS POR PAGAR (AP):');
        if (DRY_RUN) {
            console.log(`   🔍 [SIMULACIÓN] Se actualizarían: ${apUpdated}`);
        } else {
            console.log(`   ✅ Actualizadas: ${apUpdated}`);
        }
        console.log(`   ⏭️  Sin cambios: ${apSkipped}`);
        console.log(`   ❌ Errores: ${apErrors}`);
        console.log(`   📊 Total procesadas: ${allAP.length}`);

        // Mostrar algunos ejemplos de cambios
        if (arUpdates.length > 0 || apUpdates.length > 0) {
            console.log('\n📋 EJEMPLOS DE CAMBIOS:');
            
            const examples = [...arUpdates.slice(0, 3), ...apUpdates.slice(0, 3)];
            examples.forEach((update) => {
                console.log(`\n   ${update.concepto.substring(0, 50)}:`);
                console.log(`      Monto Total: ${update.montoOriginal.toFixed(2)}`);
                console.log(`      Pagado: ${update.montoPagadoActual.toFixed(2)} → ${update.montoPagadoNuevo.toFixed(2)}`);
                console.log(`      Restante: ${update.montoRestanteNuevo.toFixed(2)}`);
                console.log(`      Status: ${update.statusActual} → ${update.statusNuevo}`);
                console.log(`      Pagos registrados: ${update.paymentCount}`);
            });
        }

        return {
            arUpdated,
            arSkipped,
            arErrors,
            arTotal: allAR.length,
            apUpdated,
            apSkipped,
            apErrors,
            apTotal: allAP.length,
            arUpdates,
            apUpdates,
        };
    } catch (error: any) {
        console.error(`❌ Error procesando organización ${organizationName}:`, error.message);
        throw error;
    }
}

async function linkPaymentsToAccounts() {
    try {
        if (DRY_RUN) {
            console.log('🔍 MODO SIMULACIÓN (DRY-RUN) - No se actualizarán registros reales\n');
        } else {
            console.log('⚠️  MODO EJECUCIÓN REAL - Se actualizarán los montos de las cuentas\n');
        }

        // Obtener todas las organizaciones
        const organizations = await prisma.organization.findMany();
        if (organizations.length === 0) {
            throw new Error('No se encontraron organizaciones en la base de datos');
        }

        console.log(`🏢 Encontradas ${organizations.length} organización(es)\n`);

        // Procesar todas las organizaciones
        const allResults: any[] = [];
        for (const org of organizations) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📋 Procesando: ${org.name} (${org.id})`);
            console.log('='.repeat(60) + '\n');

            const result = await processOrganization(org.id, org.name);
            allResults.push({ orgName: org.name, ...result });
        }

        // ============================================
        // RESUMEN GLOBAL
        // ============================================
        console.log('\n\n' + '='.repeat(60));
        console.log('📈 RESUMEN GLOBAL DE ACTUALIZACIÓN');
        console.log('='.repeat(60));

        const totalARUpdated = allResults.reduce((sum, r) => sum + r.arUpdated, 0);
        const totalARSkipped = allResults.reduce((sum, r) => sum + r.arSkipped, 0);
        const totalARErrors = allResults.reduce((sum, r) => sum + r.arErrors, 0);
        const totalARTotal = allResults.reduce((sum, r) => sum + r.arTotal, 0);

        const totalAPUpdated = allResults.reduce((sum, r) => sum + r.apUpdated, 0);
        const totalAPSkipped = allResults.reduce((sum, r) => sum + r.apSkipped, 0);
        const totalAPErrors = allResults.reduce((sum, r) => sum + r.apErrors, 0);
        const totalAPTotal = allResults.reduce((sum, r) => sum + r.apTotal, 0);

        console.log('\n💰 CUENTAS POR COBRAR (AR):');
        if (DRY_RUN) {
            console.log(`   🔍 [SIMULACIÓN] Se actualizarían: ${totalARUpdated}`);
        } else {
            console.log(`   ✅ Actualizadas: ${totalARUpdated}`);
        }
        console.log(`   ⏭️  Sin cambios: ${totalARSkipped}`);
        console.log(`   ❌ Errores: ${totalARErrors}`);
        console.log(`   📊 Total procesadas: ${totalARTotal}`);

        console.log('\n💸 CUENTAS POR PAGAR (AP):');
        if (DRY_RUN) {
            console.log(`   🔍 [SIMULACIÓN] Se actualizarían: ${totalAPUpdated}`);
        } else {
            console.log(`   ✅ Actualizadas: ${totalAPUpdated}`);
        }
        console.log(`   ⏭️  Sin cambios: ${totalAPSkipped}`);
        console.log(`   ❌ Errores: ${totalAPErrors}`);
        console.log(`   📊 Total procesadas: ${totalAPTotal}`);

        // Mostrar ejemplos de cambios
        const allARUpdates = allResults.flatMap(r => r.arUpdates);
        const allAPUpdates = allResults.flatMap(r => r.apUpdates);

        if (allARUpdates.length > 0 || allAPUpdates.length > 0) {
            console.log('\n📋 EJEMPLOS DE CAMBIOS:');
            
            const examples = [...allARUpdates.slice(0, 3), ...allAPUpdates.slice(0, 3)];
            examples.forEach((update) => {
                console.log(`\n   ${update.concepto.substring(0, 50)}:`);
                console.log(`      Monto Total: ${update.montoOriginal.toFixed(2)}`);
                console.log(`      Pagado: ${update.montoPagadoActual.toFixed(2)} → ${update.montoPagadoNuevo.toFixed(2)}`);
                console.log(`      Restante: ${update.montoRestanteNuevo.toFixed(2)}`);
                console.log(`      Status: ${update.statusActual} → ${update.statusNuevo}`);
                console.log(`      Pagos registrados: ${update.paymentCount}`);
            });
        }

        if (DRY_RUN && (totalARUpdated > 0 || totalAPUpdated > 0)) {
            console.log('\n💡 Para ejecutar la actualización real, ejecuta:');
            console.log('   ts-node scripts/link-payments-to-accounts.ts --apply');
        }

    } catch (error: any) {
        console.error('❌ Error en la actualización:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar actualización
console.log('🚀 Iniciando ligado de pagos a cuentas...\n');
linkPaymentsToAccounts()
    .then(() => {
        if (DRY_RUN) {
            console.log('\n✅ Simulación completada (ningún dato fue modificado)');
        } else {
            console.log('\n✅ Actualización completada');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

