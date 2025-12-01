import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'dev@sigma.com';
    const user = await prisma.user.findFirst({
        where: { email },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    // @ts-ignore
    console.log(`User: ${user.email}, Role: ${user.role?.name}`);
    console.log('Permissions:');
    // @ts-ignore
    user.role?.permissions.forEach((rp: any) => {
        console.log(`- ${rp.permission.resource}:${rp.permission.action}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
