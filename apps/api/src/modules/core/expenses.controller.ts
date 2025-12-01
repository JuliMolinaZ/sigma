import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ExpensesController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @Permissions('expenses:read')
    @ApiOperation({ summary: 'Get all expenses' })
    @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
    async getExpenses(
        @Request() req,
        @Query('status') status?: string,
        @Query('projectId') projectId?: string,
        @Query('category') category?: string,
        @Query('search') search?: string,
    ) {
        const where: any = {
            organizationId: req.user.organizationId,
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        if (projectId) {
            where.projectId = projectId;
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }

        const expenses = await this.prisma.expense.findMany({
            where,
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
            },
        });

        return expenses;
    }

    @Post()
    @Permissions('expenses:create')
    @ApiOperation({ summary: 'Create a new expense' })
    @ApiResponse({ status: 201, description: 'Expense created successfully' })
    async createExpense(@Request() req, @Body() createData: any) {
        const expense = await this.prisma.expense.create({
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
            },
        });

        return expense;
    }

    @Get(':id')
    @Permissions('expenses:read')
    @ApiOperation({ summary: 'Get expense by ID' })
    @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
    async getExpense(@Param('id') id: string, @Request() req) {
        const expense = await this.prisma.expense.findFirst({
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
            },
        });

        return expense;
    }

    @Patch(':id')
    @Permissions('expenses:update')
    @ApiOperation({ summary: 'Update expense' })
    @ApiResponse({ status: 200, description: 'Expense updated successfully' })
    async updateExpense(@Param('id') id: string, @Request() req, @Body() updateData: any) {
        const expense = await this.prisma.expense.updateMany({
            where: {
                id,
                organizationId: req.user.organizationId,
            },
            data: updateData,
        });

        return expense;
    }

    @Delete(':id')
    @Permissions('expenses:delete')
    @ApiOperation({ summary: 'Delete expense' })
    @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
    async deleteExpense(@Param('id') id: string, @Request() req) {
        await this.prisma.expense.deleteMany({
            where: {
                id,
                organizationId: req.user.organizationId,
            },
        });

        return { success: true };
    }
}

