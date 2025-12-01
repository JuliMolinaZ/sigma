import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Setting up Specific Users ---');

    // 1. Get Organization and Roles
    const orgId = 'cdeeb8d7-e39a-4af6-818b-bc7864a9f442'; // RUNITE Legacy
    const ceoRole = await prisma.role.findFirst({ where: { name: 'CEO', organizationId: orgId } });
    const cfoRole = await prisma.role.findFirst({ where: { name: 'CFO', organizationId: orgId } });

    if (!ceoRole || !cfoRole) {
        console.error('CEO or CFO role not found');
        return;
    }

    // 2. Get Password Hash from existing user
    const existingUser = await prisma.user.findFirst({ where: { email: 'j.molina@sigma.com' } });
    if (!existingUser) {
        console.error('Reference user not found');
        return;
    }
    const passwordHash = existingUser.password;

    // 3. Create/Update JC Yanez (CEO)
    const jcYanez = await prisma.user.upsert({
        where: {
            email_organizationId: {
                email: 'jc.yanez@runsolutions-services.com',
                organizationId: orgId
            }
        },
        update: {
            firstName: 'Juan Carlos',
            lastName: 'Yanez',
            roleId: ceoRole.id,
            password: passwordHash,
            isActive: true
        },
        create: {
            email: 'jc.yanez@runsolutions-services.com',
            firstName: 'Juan Carlos',
            lastName: 'Yanez',
            roleId: ceoRole.id,
            organizationId: orgId,
            password: passwordHash,
            isActive: true
        }
    });
    console.log(`User created/updated: ${jcYanez.email} (CEO)`);

    // 4. Create/Update J Oviedo (CFO)
    const jOviedo = await prisma.user.upsert({
        where: {
            email_organizationId: {
                email: 'j.oviedo@runsolutions-services.com',
                organizationId: orgId
            }
        },
        update: {
            firstName: 'Jessica', // Assuming J stands for Jessica based on previous context, or just J.
            lastName: 'Oviedo',
            roleId: cfoRole.id,
            password: passwordHash,
            isActive: true
        },
        create: {
            email: 'j.oviedo@runsolutions-services.com',
            firstName: 'Jessica',
            lastName: 'Oviedo',
            roleId: cfoRole.id,
            organizationId: orgId,
            password: passwordHash,
            isActive: true
        }
    });
    console.log(`User created/updated: ${jOviedo.email} (CFO)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
