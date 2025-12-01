import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function populateARClients() {
    console.log('\n👥 POBLAR CLIENTES EN CUENTAS POR COBRAR\n');
    console.log('═'.repeat(60));

    try {
        // 1. Obtener todas las cuentas por cobrar sin clientId
        console.log('\n📋 Paso 1: Obteniendo cuentas por cobrar sin cliente...');

        type AccountReceivableWithProject = Prisma.AccountReceivableGetPayload<{
            include: {
                project: {
                    select: {
                        id: true;
                        name: true;
                        clientId: true;
                        client: {
                            select: {
                                id: true;
                                nombre: true;
                            };
                        };
                    };
                };
            };
        }>;

        const accountsReceivable = (await prisma.accountReceivable.findMany({
            where: {
                clientId: null,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        clientId: true,
                        client: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
            },
        })) as AccountReceivableWithProject[];

        console.log(`   Encontradas ${accountsReceivable.length} cuentas sin cliente`);

        // 2. Actualizar clientId desde el proyecto
        console.log('\n📋 Paso 2: Actualizando clientId desde proyectos...');

        let updatedCount = 0;
        let skippedCount = 0;
        const updates: { arId: string; clientId: string; projectName: string; clientName: string }[] = [];

        for (const ar of accountsReceivable) {
            if (ar.project?.clientId) {
                await prisma.accountReceivable.update({
                    where: { id: ar.id },
                    data: { clientId: ar.project.clientId },
                });

                updates.push({
                    arId: ar.id,
                    clientId: ar.project.clientId,
                    projectName: ar.project.name,
                    clientName: ar.project.client?.nombre || 'N/A',
                });

                updatedCount++;
            } else {
                skippedCount++;
                console.log(`   ⚠️  Proyecto sin cliente: ${ar.project?.name || ar.projectId}`);
            }
        }

        console.log(`   ✅ Actualizadas ${updatedCount} cuentas por cobrar`);
        console.log(`   ⚠️  Omitidas ${skippedCount} cuentas (proyecto sin cliente)`);

        // 3. Mostrar muestra de actualizaciones
        if (updates.length > 0) {
            console.log('\n📋 Muestra de actualizaciones (primeras 5):');
            updates.slice(0, 5).forEach((update, index) => {
                console.log(`   ${index + 1}. Proyecto: ${update.projectName}`);
                console.log(`      Cliente: ${update.clientName}`);
                console.log(`      AR ID: ${update.arId.substring(0, 8)}...`);
                console.log('');
            });
        }

        // 4. Verificar cuentas por cobrar que aún no tienen cliente
        console.log('\n📋 Paso 3: Verificando cuentas restantes sin cliente...');

        const remainingWithoutClient = await prisma.accountReceivable.findMany({
            where: {
                clientId: null,
            },
            include: {
                project: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (remainingWithoutClient.length > 0) {
            console.log(`\n   ⚠️  ${remainingWithoutClient.length} cuentas aún sin cliente:`);
            remainingWithoutClient.forEach((ar, index) => {
                console.log(`   ${index + 1}. ${ar.concepto} (Proyecto: ${ar.project?.name || 'Sin proyecto'})`);
            });
            console.log('\n   💡 Estas cuentas requieren asignación manual de cliente');
        } else {
            console.log('   ✅ Todas las cuentas por cobrar tienen cliente asignado');
        }

        // 5. Resumen final
        console.log('\n📊 RESUMEN FINAL\n');
        console.log('═'.repeat(60));

        const totalAR = await prisma.accountReceivable.count();
        const arWithClient = await prisma.accountReceivable.count({
            where: { clientId: { not: null } },
        });
        const arWithoutClient = await prisma.accountReceivable.count({
            where: { clientId: null },
        });

        console.log(`✅ Total de cuentas por cobrar: ${totalAR}`);
        console.log(`✅ Con cliente asignado: ${arWithClient} (${((arWithClient / totalAR) * 100).toFixed(1)}%)`);
        console.log(`⚠️  Sin cliente asignado: ${arWithoutClient} (${((arWithoutClient / totalAR) * 100).toFixed(1)}%)`);

        console.log('\n✅ Población de clientes completada!\n');

    } catch (error) {
        console.error('\n❌ Error durante la población:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar script
populateARClients()
    .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script falló:', error);
        process.exit(1);
    });
