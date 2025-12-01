import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging AP/AR Data Distribution ---');

    const orgs = await prisma.organization.findMany();

    for (const org of orgs) {
        console.log(`\nOrganization: ${org.name} (${org.id})`);

        const arCount = await prisma.accountReceivable.count({
            where: { organizationId: org.id }
        });
        console.log(`  Accounts Receivable: ${arCount}`);

        const apCount = await prisma.accountPayable.count({
            where: { organizationId: org.id }
        });
        console.log(`  Accounts Payable: ${apCount}`);

        const users = await prisma.user.findMany({
            where: { organizationId: org.id },
            select: { email: true, role: { select: { name: true } } }
        });
        console.log(`  Users: ${users.map(u => `${u.email} (${u.role?.name})`).join(', ')}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
