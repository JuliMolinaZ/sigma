#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ClientData {
    run_cliente: string;
    nombre: string;
    rfc?: string;
    direccion?: string;
}

interface SupplierData {
    run_proveedor: string;
    nombre: string;
    direccion?: string;
    datos_bancarios: string;
    contacto: string;
}

interface CategoryData {
    nombre: string;
}

interface PhaseData {
    nombre: string;
    descripcion?: string;
}

async function main() {
    console.log('🚀 Starting data restoration from backup...\n');

    try {
        // Get organization
        const org = await prisma.organization.findFirst();
        if (!org) {
            throw new Error('No organization found. Please run seed first.');
        }
        console.log(`✓ Using organization: ${org.name}\n`);

        // Restore Clients
        console.log('📦 Restoring Clients...');
        const clients: ClientData[] = [
            { run_cliente: 'R107', nombre: 'RAYMOND', rfc: 'CRM9307216Z4', direccion: 'Acceso V 107-B Desarrollo Montaña 2000, Sección III, 76150 Santiago de Querétaro, Qro' },
            { run_cliente: 'RCM03', nombre: 'INSTALACIONES PROFESIONALES Y SERVICIOS', rfc: 'IPS100803CY4', direccion: 'CARRETERA QUERETARO SAN LUIS POTOSI #24100' },
            { run_cliente: 'R01', nombre: 'RUN SOLUTIONS INTERNO', rfc: 'RSA240326G94', direccion: 'Priv. de los Industriales 110A-int. 302' },
            { run_cliente: 'RRN11', nombre: 'COMERCIALIZADORA RAYONEGRO', rfc: 'CRA160112GS6', direccion: 'NECAXA 142 DEL BENITO JUAREZ' },
            { run_cliente: 'RPT17', nombre: 'CEMENTOS ESPAÑOLES DE BOMBEO', rfc: 'CEB160930PX5', direccion: 'AV MOLIERE #39 PISO 5' },
            { run_cliente: 'RMC06', nombre: 'MYCARD', rfc: 'MYC000113M62', direccion: 'Boutros 1, El Sauz, Tequisquiapan' },
            { run_cliente: 'RS04', nombre: 'SUMINISTROS Y APLICACIONES ELECTROINDUSTRIALES DE QUERETARO', rfc: 'SAE990430IB6', direccion: 'Calle Grieta #87' },
            { run_cliente: 'RFC04', nombre: 'POR UN MEXICO CON AMOR PROPIO', rfc: 'UMA130902HE6', direccion: 'ALAMO 99 2DO PISO' },
            { run_cliente: 'R02', nombre: 'STAINLESS MACRO TRADE', rfc: 'SMT970709I93', direccion: 'Calle 2 104-A, Jurica' },
            { run_cliente: 'RGT18', nombre: 'GUEPIER', rfc: 'GM0240913F27', direccion: 'Altata #7 SN Col. Hipodromo' },
            { run_cliente: 'RML05', nombre: 'MOLEMAB', rfc: 'MME1306175H9', direccion: '76269' },
            { run_cliente: 'RDIS26', nombre: 'DISAL', rfc: '0614-250107-104', direccion: 'Final Avenida San Martin, El Salvador' },
            { run_cliente: 'RRP29', nombre: 'Emilio Picazo', rfc: '', direccion: '' },
            { run_cliente: 'LICRUN', nombre: 'LICENCIAMIENTOS RUN', rfc: 'NO APLICA', direccion: 'NO APLICA' },
        ];

        for (const client of clients) {
            const existing = await prisma.client.findFirst({
                where: {
                    runCliente: client.run_cliente,
                    organizationId: org.id,
                },
            });

            if (existing) {
                await prisma.client.update({
                    where: { id: existing.id },
                    data: {
                        nombre: client.nombre,
                        rfc: client.rfc,
                        direccion: client.direccion,
                    },
                });
            } else {
                await prisma.client.create({
                    data: {
                        runCliente: client.run_cliente,
                        nombre: client.nombre,
                        rfc: client.rfc,
                        direccion: client.direccion,
                        organizationId: org.id,
                    },
                });
            }
        }
        console.log(`✓ Restored ${clients.length} clients\n`);

        // Restore Suppliers
        console.log('📦 Restoring Suppliers...');
        const suppliers: SupplierData[] = [
            { run_proveedor: 'PRV01', nombre: 'Andrés Daniel García Hernández', direccion: 'Online', datos_bancarios: '1272556118', contacto: 'Andrés Daniel García Hernández' },
            { run_proveedor: 'PRV15', nombre: 'IMANCITOS', direccion: 'C. Ramon Rodriguez Familiar 23', datos_bancarios: 'Inbursa Cuenta: 50046132261', contacto: 'Jorge 442 436 2319' },
            { run_proveedor: 'PRV02', nombre: 'Edgar López López', direccion: 'Online', datos_bancarios: '1254958147', contacto: 'Edgar López López' },
            { run_proveedor: 'PRV04', nombre: 'Print It', direccion: 'Zibata', datos_bancarios: '072680006258207531', contacto: 'Juan Colin 442 554 8423' },
            { run_proveedor: 'PRV11', nombre: 'Q2B', direccion: 'Privada de los industriales 110-A', datos_bancarios: '014680655042355260', contacto: '442 290 3822' },
        ];

        for (const supplier of suppliers) {
            const existing = await prisma.supplier.findFirst({
                where: {
                    runProveedor: supplier.run_proveedor,
                    organizationId: org.id,
                },
            });

            if (existing) {
                await prisma.supplier.update({
                    where: { id: existing.id },
                    data: {
                        nombre: supplier.nombre,
                        direccion: supplier.direccion,
                        datosBancarios: supplier.datos_bancarios,
                        contacto: supplier.contacto,
                    },
                });
            } else {
                await prisma.supplier.create({
                    data: {
                        runProveedor: supplier.run_proveedor,
                        nombre: supplier.nombre,
                        direccion: supplier.direccion,
                        datosBancarios: supplier.datos_bancarios,
                        contacto: supplier.contacto,
                        organizationId: org.id,
                    },
                });
            }
        }
        console.log(`✓ Restored ${suppliers.length} suppliers\n`);

        // Restore Categories
        console.log('📦 Restoring Categories...');
        const categories: CategoryData[] = [
            { nombre: 'Horas Extra Ti' },
            { nombre: 'Horas Extra Operativas' },
            { nombre: 'Horas Extras Pagadas al Doble' },
            { nombre: 'Nomina México' },
            { nombre: 'Nomina Colombia' },
            { nombre: 'Reembolso a Colaboradores' },
            { nombre: 'Plataformas y TI Servidor' },
            { nombre: 'Educación y Desarrollo de colaboradores' },
            { nombre: 'Impuestos SAT' },
            { nombre: 'IMSS Seguro Social Colaboradores' },
        ];

        for (const category of categories) {
            const existing = await prisma.category.findFirst({
                where: {
                    nombre: category.nombre,
                    organizationId: org.id,
                },
            });

            if (existing) {
                await prisma.category.update({
                    where: { id: existing.id },
                    data: {
                        nombre: category.nombre,
                    },
                });
            } else {
                await prisma.category.create({
                    data: {
                        nombre: category.nombre,
                        organizationId: org.id,
                    },
                });
            }
        }
        console.log(`✓ Restored ${categories.length} categories\n`);

        // Restore Phases
        console.log('📦 Restoring Phases...');
        const phases: PhaseData[] = [
            { nombre: 'Planeación', descripcion: 'Fase inicial del proyecto donde se realiza la planeación.' },
            { nombre: 'Desarrollo', descripcion: 'Fase donde se implementan las actividades del proyecto.' },
            { nombre: 'Pruebas', descripcion: 'Fase donde se realizan pruebas al producto o servicio.' },
            { nombre: 'Entrega', descripcion: 'Fase final donde se entrega el producto o servicio.' },
        ];

        for (const phase of phases) {
            const existing = await prisma.phase.findFirst({
                where: {
                    name: phase.nombre,
                    organizationId: org.id,
                },
            });

            if (existing) {
                await prisma.phase.update({
                    where: { id: existing.id },
                    data: {
                        name: phase.nombre,
                        description: phase.descripcion,
                    },
                });
            } else {
                await prisma.phase.create({
                    data: {
                        name: phase.nombre,
                        description: phase.descripcion,
                        organizationId: org.id,
                    },
                });
            }
        }
        console.log(`✓ Restored ${phases.length} phases\n`);

        console.log('✅ Data restoration completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Clients: ${clients.length}`);
        console.log(`   - Suppliers: ${suppliers.length}`);
        console.log(`   - Categories: ${categories.length}`);
        console.log(`   - Phases: ${phases.length}`);
        console.log('\n💡 Note: Projects, AR, and AP data will need to be migrated separately.');

    } catch (error) {
        console.error('❌ Error during restoration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
