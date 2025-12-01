
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const clientName = 'Emilio Picazo';
    console.log(`Updating client: ${clientName}`);

    const client = await prisma.client.findFirst({
        where: {
            nombre: {
                contains: clientName,
                mode: 'insensitive',
            },
        },
    });

    if (!client) {
        console.log('Client not found!');
        return;
    }

    const updated = await prisma.client.update({
        where: { id: client.id },
        data: {
            email: 'emilio.picazo@example.com',
            telefono: '+52 55 1234 5678',
            contacto: 'Emilio Picazo',
            rfc: 'PICE800101H23',
            direccion: 'Av. Reforma 123, CDMX',
        },
    });

    console.log('Client updated:', updated);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
