import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateModuleVisibilityDto } from './dto/update-module-visibility.dto';

@Injectable()
export class OrganizationModulesService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get all enabled modules for an organization
     */
    async getEnabledModules(organizationId: string) {
        const modules = await this.prisma.organizationModule.findMany({
            where: {
                organizationId,
                isEnabled: true,
            },
            select: {
                moduleId: true,
                isEnabled: true,
            },
        });

        return modules;
    }

    /**
     * Get all modules with their enabled status for an organization
     */
    async getAllModulesStatus(organizationId: string) {
        const modules = await this.prisma.organizationModule.findMany({
            where: {
                organizationId,
            },
            select: {
                id: true,
                moduleId: true,
                isEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                moduleId: 'asc',
            },
        });

        return modules;
    }

    /**
     * Toggle a single module visibility
     */
    async toggleModuleVisibility(
        organizationId: string,
        moduleId: string,
        isEnabled: boolean,
    ) {
        const existingModule = await this.prisma.organizationModule.findUnique({
            where: {
                organizationId_moduleId: {
                    organizationId,
                    moduleId,
                },
            },
        });

        if (existingModule) {
            return await this.prisma.organizationModule.update({
                where: {
                    organizationId_moduleId: {
                        organizationId,
                        moduleId,
                    },
                },
                data: {
                    isEnabled,
                },
            });
        } else {
            return await this.prisma.organizationModule.create({
                data: {
                    organizationId,
                    moduleId,
                    isEnabled,
                },
            });
        }
    }

    /**
     * Batch update modules visibility
     */
    async batchUpdateModules(
        organizationId: string,
        modules: UpdateModuleVisibilityDto[],
    ) {
        const operations = modules.map((module) =>
            this.toggleModuleVisibility(
                organizationId,
                module.moduleId,
                module.isEnabled,
            ),
        );

        await Promise.all(operations);

        return {
            success: true,
            updated: modules.length,
        };
    }

    /**
     * Initialize default modules for a new organization (all enabled by default)
     */
    async initializeDefaultModules(organizationId: string, moduleIds: string[]) {
        const modulesToCreate = moduleIds.map((moduleId) => ({
            organizationId,
            moduleId,
            isEnabled: true,
        }));

        await this.prisma.organizationModule.createMany({
            data: modulesToCreate,
            skipDuplicates: true,
        });

        return {
            success: true,
            initialized: modulesToCreate.length,
        };
    }
}
