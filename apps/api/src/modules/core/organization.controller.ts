import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Organization')
@Controller('organization')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class OrganizationController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @Permissions('organizations:read')
    @ApiOperation({ summary: 'Get organization details' })
    @ApiResponse({ status: 200, description: 'Organization details retrieved successfully' })
    async getOrganization(@Request() req) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return organization;
    }

    @Patch()
    @Permissions('organizations:update')
    @ApiOperation({ summary: 'Update organization details' })
    @ApiResponse({ status: 200, description: 'Organization updated successfully' })
    async updateOrganization(@Request() req, @Body() updateData: { name?: string; slug?: string }) {
        const organization = await this.prisma.organization.update({
            where: { id: req.user.organizationId },
            data: updateData,
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return organization;
    }
}

