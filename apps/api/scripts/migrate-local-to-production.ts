#!/usr/bin/env ts-node

/**
 * Script para migrar datos de la base de datos local a producción
 * 
 * EXCLUYE:
 * - tasks (tabla de tareas)
 * - comments (relacionada con tasks)
 * - attachments (relacionada con tasks)
 * - time_entries (relacionada con tasks)
 * 
 * USO:
 *   1. Configurar variables de entorno:
 *      export LOCAL_DATABASE_URL="postgresql://sigma:sigma_password@localhost:5432/sigma_db"
 *      export PROD_DATABASE_URL="postgresql://sigma:password@64.23.225.99:5432/sigma_db"
 * 
 *   2. Modo simulación (dry-run):
 *      ts-node apps/api/scripts/migrate-local-to-production.ts --dry-run
 * 
 *   3. Ejecutar migración real:
 *      ts-node apps/api/scripts/migrate-local-to-production.ts
 * 
 *   4. Saltar backup (si ya tienes uno):
 *      ts-node apps/api/scripts/migrate-local-to-production.ts --skip-backup
 * 
 * IMPORTANTE: 
 * - Este script hace un backup antes de migrar (requiere pg_dump)
 * - Los datos existentes se actualizarán, los nuevos se insertarán
 * - Las tareas NO se migrarán (se excluyen explícitamente)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Configuración - Leer desde .env del root o apps/api
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 'postgresql://sigma:sigma_password@localhost:5432/sigma_db';
// Para producción, usar la variable del .env del root
const PROD_DB_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://sigma:p4kT9e9QyuUFk4p1qgz1Nvy9GNR5shp@64.23.225.99:5432/sigma_db';

// Tablas a excluir
const EXCLUDED_TABLES = [
    'tasks',
    'comments',
    'attachments',
    'time_entries',
];

// Tablas que deben migrarse en orden (respetando dependencias)
const MIGRATION_ORDER = [
    'organizations',
    'roles',
    'users',
    'clients',
    'suppliers',
    'categories',
    'projects',
    'phases',
    'sprints',
    'accounts',
    'accounts_receivable',
    'accounts_payable',
    'payment_complements',
    'invoices',
    'quotes',
    'purchase_orders',
    'requisitions',
    'fixed_costs',
    'recoveries',
    'flow_recoveries',
    'journal_entries',
    'journal_lines',
    'dispatches',
    'dispatch_attachments',
    'organization_modules',
    'expenses',
];

const prismaLocal = new PrismaClient({
    datasources: {
        db: {
            url: LOCAL_DB_URL,
        },
    },
});

const prismaProd = new PrismaClient({
    datasources: {
        db: {
            url: PROD_DB_URL,
        },
    },
});

interface MigrationStats {
    table: string;
    inserted: number;
    updated: number;
    errors: number;
}

async function getTableData(tableName: string, prisma: PrismaClient) {
    // Usar raw query para obtener todos los datos
    const result = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);
    return result as any[];
}

async function migrateTable(tableName: string): Promise<MigrationStats> {
    const stats: MigrationStats = {
        table: tableName,
        inserted: 0,
        updated: 0,
        errors: 0,
    };

    try {
        console.log(`\n📦 Migrando tabla: ${tableName}...`);

        // Obtener datos de local
        const localData = await getTableData(tableName, prismaLocal);
        console.log(`   📊 Encontrados ${localData.length} registros en local`);

        if (localData.length === 0) {
            console.log(`   ⏭️  Tabla vacía, saltando...`);
            return stats;
        }

        // Obtener datos existentes en producción
        const prodData = await getTableData(tableName, prismaProd);
        const prodIds = new Set(prodData.map((row: any) => row.id));

        // Preparar datos para inserción
        const toInsert: any[] = [];
        const toUpdate: any[] = [];

        for (const row of localData) {
            if (prodIds.has(row.id)) {
                toUpdate.push(row);
            } else {
                toInsert.push(row);
            }
        }

        console.log(`   ➕ ${toInsert.length} registros nuevos`);
        console.log(`   🔄 ${toUpdate.length} registros a actualizar`);

        // Insertar nuevos registros en lotes
        if (toInsert.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < toInsert.length; i += batchSize) {
                const batch = toInsert.slice(i, i + batchSize);
                
                for (const row of batch) {
                    try {
                        const columns = Object.keys(row);
                        const columnNames = columns.map(col => `"${col}"`).join(', ');
                        const values = columns.map(col => {
                            const val = row[col];
                            if (val === null || val === undefined) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                            if (val instanceof Date) return `'${val.toISOString()}'`;
                            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                            return val;
                        }).join(', ');
                        
                        const query = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values}) ON CONFLICT (id) DO NOTHING`;
                        await prismaProd.$executeRawUnsafe(query);
                        stats.inserted++;
                    } catch (error: any) {
                        console.error(`   ❌ Error insertando registro ${row.id}: ${error.message}`);
                        stats.errors++;
                    }
                }
            }
        }

        // Actualizar registros existentes
        if (toUpdate.length > 0) {
            for (const row of toUpdate) {
                try {
                    const columns = Object.keys(row).filter(col => col !== 'id' && col !== 'created_at');
                    const setClause = columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return `"${col}" = NULL`;
                        if (typeof val === 'string') return `"${col}" = '${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `"${col}" = '${val.toISOString()}'`;
                        if (typeof val === 'boolean') return `"${col}" = ${val ? 'TRUE' : 'FALSE'}`;
                        if (typeof val === 'object') return `"${col}" = '${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return `"${col}" = ${val}`;
                    }).join(', ');
                    
                    const query = `UPDATE "${tableName}" SET ${setClause} WHERE id = '${row.id}'`;
                    await prismaProd.$executeRawUnsafe(query);
                    stats.updated++;
                } catch (error: any) {
                    console.error(`   ❌ Error actualizando registro ${row.id}: ${error.message}`);
                    stats.errors++;
                }
            }
        }

        console.log(`   ✅ Completado: ${stats.inserted} insertados, ${stats.updated} actualizados, ${stats.errors} errores`);

    } catch (error: any) {
        console.error(`   ❌ Error migrando tabla ${tableName}: ${error.message}`);
        stats.errors++;
    }

    return stats;
}

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../backups/prod-backup-${timestamp}.sql`);
    
    console.log(`\n💾 Creando backup de producción...`);
    console.log(`   📁 Ruta: ${backupPath}`);
    
    // Crear directorio si no existe
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Usar pg_dump si está disponible
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
        const pgDumpCmd = `PGPASSWORD="${PROD_DB_URL.split('@')[0].split(':')[2]}" pg_dump -h ${PROD_DB_URL.split('@')[1].split(':')[0]} -p ${PROD_DB_URL.split('@')[1].split(':')[1].split('/')[0]} -U ${PROD_DB_URL.split('@')[0].split(':')[1]} -d ${PROD_DB_URL.split('/').pop()} > ${backupPath}`;
        await execAsync(pgDumpCmd);
        console.log(`   ✅ Backup creado exitosamente`);
        return backupPath;
    } catch (error) {
        console.log(`   ⚠️  No se pudo crear backup automático (pg_dump no disponible)`);
        console.log(`   💡 Por favor, crea un backup manual antes de continuar`);
        return null;
    }
}

async function main() {
    const DRY_RUN = process.argv.includes('--dry-run');
    const SKIP_BACKUP = process.argv.includes('--skip-backup');

    console.log('🚀 Iniciando migración de datos local → producción\n');
    console.log(`📊 Base de datos local: ${LOCAL_DB_URL.split('@')[1]}`);
    console.log(`📊 Base de datos producción: ${PROD_DB_URL.split('@')[1]}`);
    console.log(`🚫 Tablas excluidas: ${EXCLUDED_TABLES.join(', ')}`);

    if (DRY_RUN) {
        console.log('\n🔍 MODO SIMULACIÓN (DRY-RUN) - No se realizarán cambios\n');
    } else {
        console.log('\n⚠️  MODO EJECUCIÓN REAL - Se modificarán datos en producción\n');
    }

    // Verificar conexiones
    try {
        await prismaLocal.$connect();
        console.log('✅ Conexión a base de datos local establecida');
    } catch (error) {
        console.error('❌ Error conectando a base de datos local:', error);
        process.exit(1);
    }

    try {
        await prismaProd.$connect();
        console.log('✅ Conexión a base de datos de producción establecida');
    } catch (error) {
        console.error('❌ Error conectando a base de datos de producción:', error);
        process.exit(1);
    }

    // Crear backup
    if (!SKIP_BACKUP && !DRY_RUN) {
        await createBackup();
    }

    // Migrar tablas en orden
    const allStats: MigrationStats[] = [];

    for (const table of MIGRATION_ORDER) {
        if (EXCLUDED_TABLES.includes(table)) {
            console.log(`\n⏭️  Saltando tabla excluida: ${table}`);
            continue;
        }

        if (DRY_RUN) {
            const localData = await getTableData(table, prismaLocal);
            console.log(`\n📦 [DRY-RUN] Tabla ${table}: ${localData.length} registros`);
        } else {
            const stats = await migrateTable(table);
            allStats.push(stats);
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));

    if (DRY_RUN) {
        console.log('🔍 Modo simulación - No se realizaron cambios');
    } else {
        const totalInserted = allStats.reduce((sum, s) => sum + s.inserted, 0);
        const totalUpdated = allStats.reduce((sum, s) => sum + s.updated, 0);
        const totalErrors = allStats.reduce((sum, s) => sum + s.errors, 0);

        console.log(`✅ Total insertados: ${totalInserted}`);
        console.log(`🔄 Total actualizados: ${totalUpdated}`);
        console.log(`❌ Total errores: ${totalErrors}`);

        if (totalErrors > 0) {
            console.log('\n⚠️  Hubo errores durante la migración. Revisa los logs arriba.');
        } else {
            console.log('\n🎉 Migración completada exitosamente!');
        }
    }

    // Cerrar conexiones
    await prismaLocal.$disconnect();
    await prismaProd.$disconnect();
}

main()
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });

