import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateInvoiceClients() {
    console.log('\n🧾 POBLAR CLIENTES EN FACTURAS\n');
    console.log('═'.repeat(60));

    try {
        // 1. Obtener todas las facturas sin clientId
        console.log('\n📋 Paso 1: Obteniendo facturas sin cliente...');

        const invoices = await prisma.invoice.findMany({
            where: {
                clientId: null,
            },
        });

        console.log(`   Encontradas ${invoices.length} facturas sin cliente`);

        if (invoices.length === 0) {
            console.log('\n✅ Todas las facturas ya tienen cliente asignado!');
            return;
        }

        // 2. Extraer información de clientes del campo documents
        console.log('\n📋 Paso 2: Extrayendo información de clientes...');

        const clientMatches: Array<{
            invoiceId: string;
            invoiceNumber: string;
            rfc?: string;
            razonSocial?: string;
            matchedClientId?: string;
            matchedClientName?: string;
        }> = [];

        for (const invoice of invoices) {
            const documents = invoice.documents as any;
            const rfc = documents?.legacy_rfc;
            const razonSocial = documents?.legacy_razonSocial;

            clientMatches.push({
                invoiceId: invoice.id,
                invoiceNumber: invoice.number,
                rfc,
                razonSocial,
            });
        }

        // 3. Buscar coincidencias con clientes existentes
        console.log('\n📋 Paso 3: Buscando coincidencias con clientes...');

        let matchedCount = 0;
        let unmatchedCount = 0;

        for (const match of clientMatches) {
            let client = null;

            // Intentar buscar por RFC primero
            if (match.rfc && match.rfc !== 'TEST' && match.rfc.length > 3) {
                client = await prisma.client.findFirst({
                    where: {
                        rfc: {
                            equals: match.rfc,
                            mode: 'insensitive',
                        },
                    },
                });
            }

            // Si no se encuentra por RFC, buscar por nombre
            if (!client && match.razonSocial && match.razonSocial !== 'test' && match.razonSocial.length > 2) {
                client = await prisma.client.findFirst({
                    where: {
                        nombre: {
                            contains: match.razonSocial,
                            mode: 'insensitive',
                        },
                    },
                });
            }

            if (client) {
                match.matchedClientId = client.id;
                match.matchedClientName = client.nombre;
                matchedCount++;
                console.log(`   ✅ Factura ${match.invoiceNumber}: ${client.nombre}`);
            } else {
                unmatchedCount++;
                console.log(`   ⚠️  Factura ${match.invoiceNumber}: No se encontró cliente (RFC: ${match.rfc}, Razón: ${match.razonSocial})`);
            }
        }

        console.log(`\n   ✅ Coincidencias encontradas: ${matchedCount}`);
        console.log(`   ⚠️  Sin coincidencia: ${unmatchedCount}`);

        // 4. Actualizar facturas con clientId
        console.log('\n📋 Paso 4: Actualizando facturas...');

        let updatedCount = 0;

        for (const match of clientMatches) {
            if (match.matchedClientId) {
                await prisma.invoice.update({
                    where: { id: match.invoiceId },
                    data: { clientId: match.matchedClientId },
                });
                updatedCount++;
            }
        }

        console.log(`   ✅ Actualizadas ${updatedCount} facturas`);

        // 5. Crear clientes para facturas sin coincidencia (opcional)
        if (unmatchedCount > 0) {
            console.log('\n📋 Paso 5: Facturas sin cliente asignado:');

            const unmatchedInvoices = clientMatches.filter(m => !m.matchedClientId);

            unmatchedInvoices.forEach((invoice, index) => {
                console.log(`   ${index + 1}. Factura: ${invoice.invoiceNumber}`);
                console.log(`      RFC: ${invoice.rfc || 'N/A'}`);
                console.log(`      Razón Social: ${invoice.razonSocial || 'N/A'}`);
                console.log('');
            });

            console.log('   💡 Opciones:');
            console.log('      1. Crear clientes manualmente en la aplicación');
            console.log('      2. Asignar a cliente existente manualmente');
            console.log('      3. Ejecutar script adicional para crear clientes automáticamente');
        }

        // 6. Resumen final
        console.log('\n📊 RESUMEN FINAL\n');
        console.log('═'.repeat(60));

        const totalInvoices = await prisma.invoice.count();
        const invoicesWithClient = await prisma.invoice.count({
            where: { clientId: { not: null } },
        });
        const invoicesWithoutClient = await prisma.invoice.count({
            where: { clientId: null },
        });

        console.log(`✅ Total de facturas: ${totalInvoices}`);
        console.log(`✅ Con cliente asignado: ${invoicesWithClient} (${((invoicesWithClient / totalInvoices) * 100).toFixed(1)}%)`);
        console.log(`⚠️  Sin cliente asignado: ${invoicesWithoutClient} (${((invoicesWithoutClient / totalInvoices) * 100).toFixed(1)}%)`);

        console.log('\n✅ Población de clientes en facturas completada!\n');

    } catch (error) {
        console.error('\n❌ Error durante la población:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar script
populateInvoiceClients()
    .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script falló:', error);
        process.exit(1);
    });
