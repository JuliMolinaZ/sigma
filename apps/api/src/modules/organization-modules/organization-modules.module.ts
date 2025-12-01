import { Module } from '@nestjs/common';
import { OrganizationModulesController } from './organization-modules.controller';
import { OrganizationModulesService } from './organization-modules.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [OrganizationModulesController],
    providers: [OrganizationModulesService, PrismaService],
    exports: [OrganizationModulesService],
})
export class OrganizationModulesModule {}
