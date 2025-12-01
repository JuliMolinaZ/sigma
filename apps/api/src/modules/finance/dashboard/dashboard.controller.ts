import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../../database/prisma.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { FinancialGuard } from '../../../common/guards/financial.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';

@ApiTags('Finance')
@Controller('finance/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, FinancialGuard, PermissionsGuard)
export class FinanceDashboardController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @Permissions('finance:read')
    @ApiOperation({ summary: 'Get finance dashboard data' })
    @ApiResponse({ status: 200, description: 'Finance dashboard data retrieved successfully' })
    async getDashboard(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        const organizationId = req.user.organizationId;

        const [
            totalAccounts,
            totalAccountsPayable,
            totalAccountsReceivable,
            totalInvoices,
            totalFixedCosts,
            recentTransactions,
        ] = await Promise.all([
            this.prisma.account.count({
                where: { organizationId },
            }),
            this.prisma.accountPayable.aggregate({
                where: { organizationId, pagado: false },
                _sum: { monto: true },
            }),
            this.prisma.accountReceivable.aggregate({
                where: { organizationId, status: 'PENDING' },
                _sum: { montoRestante: true },
            }),
            this.prisma.invoice.aggregate({
                where: { organizationId },
                _sum: { total: true },
            }),
            this.prisma.fixedCost.aggregate({
                where: { organizationId },
                _sum: { monto: true },
            }),
            this.prisma.journalEntry.findMany({
                where: { organizationId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    lines: {
                        include: {
                            debitAccount: {
                                select: { name: true, code: true },
                            },
                            creditAccount: {
                                select: { name: true, code: true },
                            },
                        },
                    },
                },
            }),
        ]);

        return {
            totalAccounts,
            totalAccountsPayable: totalAccountsPayable._sum.monto || 0,
            totalAccountsReceivable: totalAccountsReceivable._sum.montoRestante || 0,
            totalInvoices: totalInvoices._sum.total || 0,
            totalFixedCosts: totalFixedCosts._sum.monto || 0,
            recentTransactions,
        };
    }
}

