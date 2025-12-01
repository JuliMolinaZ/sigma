import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AuditController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @Permissions('audit:read')
    @ApiOperation({ summary: 'Get audit logs' })
    @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
    async getAuditLogs(
        @Request() req,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Query('resource') resource?: string,
        @Query('action') action?: string,
    ) {
        const take = limit ? parseInt(limit, 10) : 50;
        const skip = offset ? parseInt(offset, 10) : 0;

        // Get all user IDs in the organization first
        const orgUsers = await this.prisma.user.findMany({
            where: { organizationId: req.user.organizationId },
            select: { id: true },
        });
        const userIds = orgUsers.map(u => u.id);

        const where: any = {
            userId: { in: userIds },
        };

        if (resource) {
            where.resource = resource;
        }

        if (action) {
            where.action = action;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            total,
            limit: take,
            offset: skip,
        };
    }
}

