
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting client population...');

    const clients = await prisma.client.findMany({
        where: {
            OR: [
                { email: null },
                { telefono: null },
                { contacto: null },
                { email: '' },
                { telefono: '' },
                { contacto: '' }
            ]
        }
    });

    console.log(`Found ${clients.length} clients with missing data.`);

    for (const client of clients) {
        const updates: any = {};

        // Generate simple deterministic data based on name/id to avoid external deps
        const nameParts = client.nombre.split(' ');
        const firstName = nameParts[0].toLowerCase().replace(/[^a-z]/g, '');
        const lastName = (nameParts[1] || 'client').toLowerCase().replace(/[^a-z]/g, '');

        if (!client.email || client.email === '') {
            updates.email = `${firstName}.${lastName}@example.com`;
        }

        if (!client.telefono || client.telefono === '') {
            // Random-ish phone number
            const random = Math.floor(Math.random() * 9000) + 1000;
            updates.telefono = `+52 55 ${random} ${Math.floor(Math.random() * 9000) + 1000}`;
        }

        if (!client.contacto || client.contacto === '') {
            updates.contacto = client.nombre; // Default contact to client name if missing
        }

        if (Object.keys(updates).length > 0) {
            console.log(`Updating client ${client.nombre} (${client.id})...`);
            await prisma.client.update({
                where: { id: client.id },
                data: updates
            });
        }
    }

    console.log('Finished populating clients.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
