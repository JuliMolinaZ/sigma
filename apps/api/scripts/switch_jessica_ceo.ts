import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Switching Jessica to CEO ---');

    const orgId = 'cdeeb8d7-e39a-4af6-818b-bc7864a9f442'; // RUNITE Legacy
    const ceoRole = await prisma.role.findFirst({ where: { name: 'CEO', organizationId: orgId } });

    if (!ceoRole) {
        console.error('CEO role not found');
        return;
    }

    // Update Jessica
    const jessica = await prisma.user.update({
        where: {
            email_organizationId: {
                email: 'j.oviedo@runsolutions-services.com',
                organizationId: orgId
            }
        },
        data: {
            roleId: ceoRole.id,
            firstName: 'Jessica',
            lastName: 'CEO (formerly CFO)'
        }
    });
    console.log(`Updated ${jessica.email} to Role: CEO`);

    // Optional: Update Juan Carlos to CFO or keep as CEO?
    // User said "Coloquemos a Jessica como CEO por ahora", implying a switch.
    // I'll leave Juan Carlos as CEO for now unless it causes conflict (usually multiple users can have same role).
    // But to be clear, I'll just update Jessica.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
