
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const clientName = 'Emilio Picazo';
    console.log(`Searching for client: ${clientName}`);

    const clients = await prisma.client.findMany({
        where: {
            nombre: {
                contains: clientName,
                mode: 'insensitive',
            },
        },
    });

    console.log(`Found ${clients.length} clients.`);
    clients.forEach(client => {
        console.log('--------------------------------------------------');
        console.log(`ID: ${client.id}`);
        console.log(`Name: ${client.nombre}`);
        console.log(`Email: ${client.email} (Type: ${typeof client.email})`);
        console.log(`Phone: ${client.telefono} (Type: ${typeof client.telefono})`);
        console.log(`Contact: ${client.contacto} (Type: ${typeof client.contacto})`);
        console.log(`RFC: ${client.rfc}`);
        console.log(`Active: ${client.isActive}`);
        console.log('--------------------------------------------------');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
