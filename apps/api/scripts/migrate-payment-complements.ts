#!/usr/bin/env ts-node

/**
 * Script para migrar pagos parciales del backup SQL a la base de datos actual
 * 
 * ⚠️  IMPORTANTE: Este script NO BORRA datos existentes
 * - Solo CREA nuevos registros (PaymentComplement)
 * - Verifica duplicados antes de crear
 * - No modifica ni elimina registros existentes
 * 
 * Uso:
 *   ts-node scripts/migrate-payment-complements.ts          # Modo simulación (dry-run)
 *   ts-node scripts/migrate-payment-complements.ts --apply  # Ejecutar migración real
 * 
 * Este script:
 * 1. Lee los complementos_pago del backup SQL
 * 2. Los liga a AccountReceivable usando legacyAccountReceivableId
 * 3. Crea los PaymentComplement en la base de datos actual (solo si no existen)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Verificar si es modo simulación
const DRY_RUN = !process.argv.includes('--apply');

interface LegacyPaymentComplement {
    id: number;
    cuenta_id: number;
    fecha_pago: string;
    concepto: string;
    monto_sin_iva: number;
    monto_con_iva: number;
    created_at: string;
    updated_at: string;
}

async function parseBackupSQL(): Promise<LegacyPaymentComplement[]> {
    const backupPath = path.join(__dirname, '../../../docs/runite_backup.sql');

    if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found at: ${backupPath}`);
    }

    const sqlContent = fs.readFileSync(backupPath, 'utf-8');

    // Buscar la línea INSERT INTO `complementos_pago`
    const insertMatch = sqlContent.match(/INSERT INTO `complementos_pago` VALUES ([\s\S]+?);/);

    if (!insertMatch) {
        console.log('⚠️  No se encontraron complementos_pago en el backup');
        return [];
    }

    const valuesString = insertMatch[1];

    // Parsear los valores - formato: (id,cuenta_id,'fecha_pago','concepto',monto_sin_iva,monto_con_iva,'created_at','updated_at')
    const rows: LegacyPaymentComplement[] = [];

    // Dividir por filas (cada fila empieza con '(')
    const rowMatches = valuesString.matchAll(/\((\d+),(\d+),'([^']+)','([^']+)',([\d.]+),([\d.]+),'([^']+)','([^']+)'\)/g);

    for (const match of rowMatches) {
        rows.push({
            id: parseInt(match[1]),
            cuenta_id: parseInt(match[2]),
            fecha_pago: match[3],
            concepto: match[4],
            monto_sin_iva: parseFloat(match[5]),
            monto_con_iva: parseFloat(match[6]),
            created_at: match[7],
            updated_at: match[8],
        });
    }

    return rows;
}

async function migratePaymentComplements() {
    try {
        if (DRY_RUN) {
            console.log('🔍 MODO SIMULACIÓN (DRY-RUN) - No se crearán registros reales\n');
        } else {
            console.log('⚠️  MODO EJECUCIÓN REAL - Se crearán registros en la base de datos\n');
        }

        console.log('🔍 Leyendo backup SQL...');
        const legacyPayments = await parseBackupSQL();

        if (legacyPayments.length === 0) {
            console.log('✅ No hay pagos parciales para migrar');
            return;
        }

        console.log(`📊 Encontrados ${legacyPayments.length} pagos parciales en el backup\n`);

        // Obtener todas las organizaciones (asumiendo que hay una organización principal)
        const organizations = await prisma.organization.findMany();
        if (organizations.length === 0) {
            throw new Error('No se encontraron organizaciones en la base de datos');
        }

        // Usar la primera organización (o puedes especificar una)
        const organizationId = organizations[0].id;
        console.log(`🏢 Usando organización: ${organizations[0].name} (${organizationId})`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const legacyPayment of legacyPayments) {
            try {
                // Buscar AccountReceivable por legacyAccountReceivableId
                const ar = await prisma.accountReceivable.findUnique({
                    where: {
                        legacyAccountReceivableId: legacyPayment.cuenta_id,
                    },
                });

                if (!ar) {
                    console.log(`⚠️  No se encontró AccountReceivable con legacy ID ${legacyPayment.cuenta_id} para pago ${legacyPayment.id}`);
                    skipped++;
                    continue;
                }

                // Verificar si ya existe un PaymentComplement con este legacy ID
                const existing = await prisma.paymentComplement.findUnique({
                    where: {
                        legacyPaymentComplementId: legacyPayment.id,
                    },
                });

                if (existing) {
                    console.log(`⏭️  PaymentComplement ${legacyPayment.id} ya existe, saltando...`);
                    skipped++;
                    continue;
                }

                // Preparar datos para crear
                const paymentData = {
                    accountReceivableId: ar.id,
                    monto: legacyPayment.monto_con_iva, // Usar monto con IVA
                    fechaPago: new Date(legacyPayment.fecha_pago),
                    formaPago: 'TRANSFER', // Default, ya que no hay info en el backup
                    notas: legacyPayment.concepto || `Migrado del backup - Pago parcial #${legacyPayment.id}`,
                    legacyPaymentComplementId: legacyPayment.id,
                    organizationId: organizationId,
                };

                if (DRY_RUN) {
                    // Modo simulación: solo mostrar qué se haría
                    console.log(`[SIMULACIÓN] Se crearía PaymentComplement ${legacyPayment.id} (${legacyPayment.monto_con_iva}) para AR ${ar.id}`);
                    migrated++;
                } else {
                    // Modo real: crear el registro
                    await prisma.paymentComplement.create({
                        data: paymentData,
                    });
                    migrated++;
                    console.log(`✅ Migrado pago ${legacyPayment.id} (${legacyPayment.monto_con_iva}) para AR ${ar.id}`);
                }
            } catch (error: any) {
                console.error(`❌ Error migrando pago ${legacyPayment.id}:`, error.message);
                errors++;
            }
        }

        console.log('\n📈 Resumen de migración:');
        if (DRY_RUN) {
            console.log(`   🔍 [SIMULACIÓN] Se crearían: ${migrated}`);
        } else {
            console.log(`   ✅ Migrados: ${migrated}`);
        }
        console.log(`   ⏭️  Saltados (ya existen): ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📊 Total procesados: ${legacyPayments.length}`);

        if (DRY_RUN && migrated > 0) {
            console.log('\n💡 Para ejecutar la migración real, ejecuta:');
            console.log('   ts-node scripts/migrate-payment-complements.ts --apply');
        }

    } catch (error: any) {
        console.error('❌ Error en la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar migración
console.log('🚀 Iniciando migración de pagos parciales...\n');
migratePaymentComplements()
    .then(() => {
        if (DRY_RUN) {
            console.log('\n✅ Simulación completada (ningún dato fue modificado)');
        } else {
            console.log('\n✅ Migración completada');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

