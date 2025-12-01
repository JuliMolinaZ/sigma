import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCategories() {
    console.log('\n🏷️  MIGRACIÓN DE CATEGORÍAS\n');
    console.log('═'.repeat(60));

    try {
        // 1. Extraer categorías únicas del campo notas de accounts_payable
        console.log('\n📋 Paso 1: Extrayendo categorías del campo notas...');

        const accountsPayable = await prisma.accountPayable.findMany({
            where: {
                notas: {
                    contains: 'Categoria Legacy:',
                },
            },
            select: {
                id: true,
                notas: true,
                organizationId: true,
            },
        });

        console.log(`   Encontradas ${accountsPayable.length} cuentas con categoría legacy`);

        // Extraer categorías únicas
        const categoryMap = new Map<string, Set<string>>();

        accountsPayable.forEach((ap) => {
            const match = ap.notas?.match(/Categoria Legacy:\s*(\w+)/i);
            if (match) {
                const categoryName = match[1].toLowerCase();
                if (!categoryMap.has(categoryName)) {
                    categoryMap.set(categoryName, new Set());
                }
                categoryMap.get(categoryName)!.add(ap.organizationId);
            }
        });

        console.log(`\n   Categorías únicas encontradas: ${categoryMap.size}`);
        categoryMap.forEach((orgs, name) => {
            console.log(`   - ${name} (${orgs.size} organizaciones)`);
        });

        // 2. Crear categorías en la base de datos
        console.log('\n📋 Paso 2: Creando categorías en la base de datos...');

        const categoryColors: Record<string, string> = {
            nomina: '#3B82F6',      // Blue
            servicios: '#10B981',   // Green
            materiales: '#F59E0B',  // Amber
            renta: '#8B5CF6',       // Purple
            impuestos: '#EF4444',   // Red
            imss: '#EC4899',        // Pink
            otro: '#6B7280',        // Gray
            costosfijos: '#14B8A6', // Teal
        };

        const categoryDescriptions: Record<string, string> = {
            nomina: 'Pagos de nómina y salarios',
            servicios: 'Servicios profesionales y técnicos',
            materiales: 'Compra de materiales y suministros',
            renta: 'Rentas y arrendamientos',
            impuestos: 'Impuestos y contribuciones',
            imss: 'Cuotas y pagos al IMSS',
            otro: 'Otros gastos no clasificados',
            costosfijos: 'Costos fijos recurrentes',
        };

        const createdCategories = new Map<string, Map<string, string>>();

        for (const [categoryName, organizationIds] of categoryMap) {
            createdCategories.set(categoryName, new Map());

            for (const orgId of organizationIds) {
                const normalizedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

                // Check if category already exists
                let category = await prisma.category.findFirst({
                    where: {
                        nombre: normalizedName,
                        organizationId: orgId,
                    },
                });

                // Create if doesn't exist
                if (!category) {
                    category = await prisma.category.create({
                        data: {
                            nombre: normalizedName,
                            descripcion: categoryDescriptions[categoryName] || `Categoría ${normalizedName}`,
                            color: categoryColors[categoryName] || '#6B7280',
                            organizationId: orgId,
                            isActive: true,
                        },
                    });
                    console.log(`   ✅ Creada: ${normalizedName} (${orgId.substring(0, 8)}...)`);
                } else {
                    console.log(`   ℹ️  Ya existe: ${normalizedName} (${orgId.substring(0, 8)}...)`);
                }

                createdCategories.get(categoryName)!.set(orgId, category.id);
            }
        }

        // 3. Actualizar categoryId en accounts_payable
        console.log('\n📋 Paso 3: Actualizando categoryId en cuentas por pagar...');

        let updatedCount = 0;

        for (const ap of accountsPayable) {
            const match = ap.notas?.match(/Categoria Legacy:\s*(\w+)/i);
            if (match) {
                const categoryName = match[1].toLowerCase();
                const categoryId = createdCategories.get(categoryName)?.get(ap.organizationId);

                if (categoryId) {
                    await prisma.accountPayable.update({
                        where: { id: ap.id },
                        data: { categoryId },
                    });
                    updatedCount++;
                }
            }
        }

        console.log(`   ✅ Actualizadas ${updatedCount} cuentas por pagar`);

        // 4. Crear categorías adicionales estándar
        console.log('\n📋 Paso 4: Creando categorías estándar adicionales...');

        const standardCategories = [
            { nombre: 'Marketing', descripcion: 'Gastos de marketing y publicidad', color: '#F97316' },
            { nombre: 'Tecnología', descripcion: 'Software, hardware y tecnología', color: '#06B6D4' },
            { nombre: 'Oficina', descripcion: 'Gastos de oficina y papelería', color: '#84CC16' },
            { nombre: 'Viajes', descripcion: 'Viajes y viáticos', color: '#A855F7' },
            { nombre: 'Capacitación', descripcion: 'Cursos y capacitación', color: '#0EA5E9' },
        ];

        // Obtener todas las organizaciones
        const organizations = await prisma.organization.findMany({
            select: { id: true },
        });

        for (const org of organizations) {
            for (const cat of standardCategories) {
                const existing = await prisma.category.findFirst({
                    where: {
                        nombre: cat.nombre,
                        organizationId: org.id,
                    },
                });

                if (!existing) {
                    await prisma.category.create({
                        data: {
                            nombre: cat.nombre,
                            descripcion: cat.descripcion,
                            color: cat.color,
                            organizationId: org.id,
                            isActive: true,
                        },
                    });
                }
            }
        }

        console.log(`   ✅ Creadas categorías estándar para ${organizations.length} organizaciones`);

        // 5. Resumen final
        console.log('\n📊 RESUMEN FINAL\n');
        console.log('═'.repeat(60));

        const totalCategories = await prisma.category.count();
        const apWithCategory = await prisma.accountPayable.count({
            where: { categoryId: { not: null } },
        });
        const apWithoutCategory = await prisma.accountPayable.count({
            where: { categoryId: null },
        });

        console.log(`✅ Total de categorías creadas: ${totalCategories}`);
        console.log(`✅ Cuentas por pagar con categoría: ${apWithCategory}`);
        console.log(`⚠️  Cuentas por pagar sin categoría: ${apWithoutCategory}`);

        if (apWithoutCategory > 0) {
            console.log('\n💡 Nota: Las cuentas sin categoría pueden asignarse manualmente');
            console.log('   o se les puede asignar la categoría "Otro" por defecto.');
        }

        console.log('\n✅ Migración de categorías completada exitosamente!\n');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar migración
migrateCategories()
    .then(() => {
        console.log('✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script falló:', error);
        process.exit(1);
    });
