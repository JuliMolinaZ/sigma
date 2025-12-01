import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Time Entries')
@Controller('time-entries')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class TimeEntriesController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @Permissions('time-tracking:read')
    @ApiOperation({ summary: 'Get all time entries' })
    @ApiResponse({ status: 200, description: 'Time entries retrieved successfully' })
    async getTimeEntries(
        @Request() req,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('projectId') projectId?: string,
        @Query('taskId') taskId?: string,
    ) {
        const take = limit ? parseInt(limit, 10) : 50;

        const where: any = {
            organizationId: req.user.organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (projectId) {
            where.projectId = projectId;
        }

        if (taskId) {
            where.taskId = taskId;
        }

        const timeEntries = await this.prisma.timeEntry.findMany({
            where,
            take,
            orderBy: { date: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return timeEntries;
    }

    @Post()
    @Permissions('time-tracking:create')
    @ApiOperation({ summary: 'Create a new time entry' })
    @ApiResponse({ status: 201, description: 'Time entry created successfully' })
    async createTimeEntry(@Request() req, @Body() createData: any) {
        const timeEntry = await this.prisma.timeEntry.create({
            data: {
                ...createData,
                userId: req.user.id,
                organizationId: req.user.organizationId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return timeEntry;
    }

    @Get(':id')
    @Permissions('time-tracking:read')
    @ApiOperation({ summary: 'Get time entry by ID' })
    @ApiResponse({ status: 200, description: 'Time entry retrieved successfully' })
    async getTimeEntry(@Param('id') id: string, @Request() req) {
        const timeEntry = await this.prisma.timeEntry.findFirst({
            where: {
                id,
                organizationId: req.user.organizationId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return timeEntry;
    }

    @Patch(':id')
    @Permissions('time-tracking:update')
    @ApiOperation({ summary: 'Update time entry' })
    @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
    async updateTimeEntry(@Param('id') id: string, @Request() req, @Body() updateData: any) {
        const timeEntry = await this.prisma.timeEntry.updateMany({
            where: {
                id,
                organizationId: req.user.organizationId,
            },
            data: updateData,
        });

        return timeEntry;
    }

    @Delete(':id')
    @Permissions('time-tracking:delete')
    @ApiOperation({ summary: 'Delete time entry' })
    @ApiResponse({ status: 200, description: 'Time entry deleted successfully' })
    async deleteTimeEntry(@Param('id') id: string, @Request() req) {
        await this.prisma.timeEntry.deleteMany({
            where: {
                id,
                organizationId: req.user.organizationId,
            },
        });

        return { success: true };
    }
}

