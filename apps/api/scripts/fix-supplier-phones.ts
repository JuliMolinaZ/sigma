import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting supplier phone extraction...');

    const suppliers = await prisma.supplier.findMany({
        where: {
            isActive: true, // Focus on active ones first, or all? Let's do all.
        },
    });

    let updatedCount = 0;

    for (const supplier of suppliers) {
        // Skip if phone is already set
        if (supplier.telefono && supplier.telefono.trim().length > 0) {
            continue;
        }

        const contact = supplier.contacto;
        if (!contact) continue;

        // Regex to find phone numbers (approximate: 10 digits, maybe spaces/dashes)
        // Matches: 1234567890, 123 456 7890, 123-456-7890
        const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
        const matches = contact.match(phoneRegex);

        if (matches && matches.length > 0) {
            const phone = matches[0];

            // Remove phone from contact to clean it up
            // Also remove extra spaces
            let newContact = contact.replace(phone, '').trim();
            // Remove trailing/leading punctuation if any
            newContact = newContact.replace(/^[-,\s]+|[-,\s]+$/g, '');

            // If contact becomes empty or just symbols, maybe it was just a phone number
            if (newContact.length < 2) {
                newContact = ''; // Or keep it null? Schema says String?
            }

            console.log(`Updating Supplier: ${supplier.nombre}`);
            console.log(`  Old Contact: "${contact}"`);
            console.log(`  New Phone:   "${phone}"`);
            console.log(`  New Contact: "${newContact}"`);

            await prisma.supplier.update({
                where: { id: supplier.id },
                data: {
                    telefono: phone,
                    contacto: newContact.length > 0 ? newContact : null, // Keep null if empty
                },
            });

            updatedCount++;
        }
    }

    console.log(`Finished. Updated ${updatedCount} suppliers.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
