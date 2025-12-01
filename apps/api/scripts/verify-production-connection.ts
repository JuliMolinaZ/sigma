#!/usr/bin/env ts-node

/**
 * Script para verificar la conexión a la base de datos de producción
 * 
 * Uso: ts-node scripts/verify-production-connection.ts
 * Desde apps/api: ts-node scripts/verify-production-connection.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyConnection() {
  try {
    console.log('🔍 Verificando conexión a la base de datos de producción...\n');

    // Verificar conexión básica
    await prisma.$connect();
    console.log('✅ Conexión establecida correctamente\n');

    // Obtener información de la base de datos
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version();
    `;
    console.log('📊 Versión de PostgreSQL:');
    console.log(`   ${result[0]?.version || 'N/A'}\n`);

    // Contar algunas tablas principales
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const clientCount = await prisma.client.count();

    console.log('📈 Estadísticas de la base de datos:');
    console.log(`   Organizaciones: ${orgCount}`);
    console.log(`   Usuarios: ${userCount}`);
    console.log(`   Proyectos: ${projectCount}`);
    console.log(`   Clientes: ${clientCount}\n`);

    // Verificar que DATABASE_URL apunta a producción
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('64.23.225.99')) {
      console.log('⚠️  ADVERTENCIA: Estás conectado a PRODUCCIÓN');
      console.log('   Ten cuidado con las operaciones que realices\n');
    } else if (dbUrl.includes('localhost:5433')) {
      console.log('🔒 Conexión segura vía túnel SSH\n');
    } else {
      console.log('ℹ️  Conexión local detectada\n');
    }

    console.log('✅ Verificación completada exitosamente');

  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection();

