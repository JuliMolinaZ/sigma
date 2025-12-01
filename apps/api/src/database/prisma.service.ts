import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { prismaTenantExtension } from '../common/extensions/prisma-tenant.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        // Extend the client with Tenant logic
        const extended = prismaTenantExtension(this);
        // Hack: Replace 'this' properties with extended client properties to ensure global usage
        Object.assign(this, extended);
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
