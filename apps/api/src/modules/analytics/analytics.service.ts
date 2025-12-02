import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardOverview(organizationId: string) {
        const [
            projectsCount,
            activeProjects,
            tasksCount,
            completedTasks,
            activeUsers,
            sprintsCount,
            recentActivity,
            totalAP,
            totalAR,
            fixedCosts,
            topClients,
            topSuppliers,
        ] = await Promise.all([
            this.prisma.project.count({
                where: { organizationId, deletedAt: null },
            }),
            this.prisma.project.count({
                where: { organizationId, status: 'ACTIVE', deletedAt: null },
            }),
            this.prisma.task.count({
                where: { organizationId },
            }),
            this.prisma.task.count({
                where: { organizationId, status: 'DONE' },
            }),
            this.prisma.user.count({
                where: { organizationId, isActive: true },
            }),
            this.prisma.sprint.count({
                where: { organizationId },
            }),
            this.prisma.auditLog.findMany({
                where: { resource: { in: ['projects', 'tasks', 'finance', 'clients', 'suppliers'] } },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            // New Metrics
            this.prisma.accountPayable.aggregate({
                where: {
                    organizationId,
                    status: { in: ['PENDING', 'PARTIAL'] }
                },
                _sum: { montoRestante: true },
            }),
            this.prisma.accountReceivable.aggregate({
                where: {
                    organizationId,
                    status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
                },
                _sum: { montoRestante: true },
            }),
            this.prisma.fixedCost.aggregate({
                where: { organizationId, isActive: true },
                _sum: { monto: true },
            }),
            this.prisma.client.findMany({
                where: { organizationId },
                take: 5,
                orderBy: {
                    invoices: {
                        _count: 'desc',
                    },
                },
                include: {
                    _count: {
                        select: { invoices: true },
                    },
                    invoices: {
                        select: {
                            amount: true,
                        },
                    },
                },
            }),
            this.prisma.supplier.findMany({
                where: { organizationId },
                take: 5,
                orderBy: {
                    accountsPayable: {
                        _count: 'desc',
                    },
                },
                include: {
                    _count: {
                        select: { accountsPayable: true },
                    },
                    accountsPayable: {
                        select: {
                            monto: true,
                        },
                    },
                },
            }),
        ]);

        const tasksCompletionRate = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;

        // Calculate monthly revenue for the last 12 months
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        const invoicesForRevenue = await this.prisma.invoice.findMany({
            where: {
                organizationId,
                issueDate: {
                    gte: twelveMonthsAgo,
                },
            },
            select: {
                amount: true,
                issueDate: true,
            },
        });

        // Group by month
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const revenueByMonth: Record<string, number> = {};

        invoicesForRevenue.forEach(invoice => {
            if (invoice.issueDate) {
                const date = new Date(invoice.issueDate);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(invoice.amount);
            }
        });

        // Create array of last 12 months with data
        const revenueData = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            revenueData.push({
                name: monthNames[date.getMonth()],
                total: revenueByMonth[monthKey] || 0,
            });
        }

        return {
            projects: {
                total: projectsCount,
                active: activeProjects,
            },
            tasks: {
                total: tasksCount,
                completed: completedTasks,
                completionRate: Math.round(tasksCompletionRate * 100) / 100,
            },
            sprints: {
                total: sprintsCount,
            },
            users: {
                active: activeUsers,
            },
            finance: {
                totalAP: totalAP._sum.montoRestante || 0,
                totalAR: totalAR._sum.montoRestante || 0,
                fixedCostsMonthly: fixedCosts._sum.monto || 0,
            },
            topClients: topClients.map(c => ({
                id: c.id,
                name: c.nombre,
                invoicesCount: c._count.invoices,
                revenue: c.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
            })),
            topSuppliers: topSuppliers.map(s => ({
                id: s.id,
                name: s.nombre,
                apCount: s._count.accountsPayable,
                totalSpent: s.accountsPayable.reduce((sum, ap) => sum + Number(ap.monto), 0),
            })),
            revenueData,
            recentActivity,
        };
    }

    async getProjectsKPIs(organizationId: string) {
        const projects = await this.prisma.project.findMany({
            where: { organizationId, deletedAt: null },
            include: {
                tasks: true,
                _count: {
                    select: {
                        tasks: true,
                        sprints: true,
                    },
                },
            },
        });

        const projectsWithMetrics = projects.map((project) => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
            const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
            const overdueTasks = project.tasks.filter(
                (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE',
            ).length;

            return {
                projectId: project.id,
                projectName: project.name,
                status: project.status,
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                totalSprints: project._count.sprints,
            };
        });

        return {
            totalProjects: projects.length,
            projects: projectsWithMetrics,
            summary: {
                avgCompletionRate:
                    projectsWithMetrics.reduce((sum, p) => sum + p.completionRate, 0) / projects.length || 0,
                totalOverdueTasks: projectsWithMetrics.reduce((sum, p) => sum + p.overdueTasks, 0),
            },
        };
    }

    async getFinanceKPIs(organizationId: string, startDate?: string, endDate?: string) {
        // Build date filter for journal entries
        const journalEntryWhere: any = { organizationId };
        if (startDate || endDate) {
            journalEntryWhere.date = {};
            if (startDate) journalEntryWhere.date.gte = new Date(startDate);
            if (endDate) journalEntryWhere.date.lte = new Date(endDate);
        }

        const [accounts, journalEntries] = await Promise.all([
            this.prisma.account.findMany({
                where: { organizationId },
            }),
            this.prisma.journalEntry.count({
                where: journalEntryWhere,
            }),
        ]);

        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalAssets = 0;
        let totalLiabilities = 0;

        // Query journal lines for each account
        for (const account of accounts) {
            // Build where clause for journal lines with date filter
            const journalLineWhere: any = {
                journalEntry: journalEntryWhere,
            };

            // Get debit entries for this account
            const debitEntries = await this.prisma.journalLine.findMany({
                where: {
                    debitAccountId: account.id,
                    ...journalLineWhere,
                },
            });

            // Get credit entries for this account
            const creditEntries = await this.prisma.journalLine.findMany({
                where: {
                    creditAccountId: account.id,
                    ...journalLineWhere,
                },
            });

            const debits = debitEntries.reduce((sum, e) => sum + Number(e.amount), 0);
            const credits = creditEntries.reduce((sum, e) => sum + Number(e.amount), 0);

            if (account.type === 'REVENUE') {
                totalRevenue += credits - debits;
            } else if (account.type === 'EXPENSE') {
                totalExpenses += debits - credits;
            } else if (account.type === 'ASSET') {
                totalAssets += debits - credits;
            } else if (account.type === 'LIABILITY') {
                totalLiabilities += credits - debits;
            }
        }

        const netIncome = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

        return {
            period: {
                startDate: startDate || null,
                endDate: endDate || null,
            },
            revenue: totalRevenue,
            expenses: totalExpenses,
            netIncome,
            profitMargin: Math.round(profitMargin * 100) / 100,
            assets: totalAssets,
            liabilities: totalLiabilities,
            equity: totalAssets - totalLiabilities,
            transactionsCount: journalEntries,
        };
    }

    async getTasksMetrics(organizationId: string) {
        const tasks = await this.prisma.task.findMany({
            where: { organizationId },
        });

        const byStatus = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byPriority = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const overdueTasks = tasks.filter(
            (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE',
        );

        const avgEstimatedHours =
            tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) / tasks.length || 0;
        const avgActualHours =
            tasks.filter((t) => t.actualHours).reduce((sum, t) => sum + (t.actualHours || 0), 0) /
            tasks.filter((t) => t.actualHours).length || 0;

        return {
            total: tasks.length,
            byStatus,
            byPriority,
            overdue: overdueTasks.length,
            avgEstimatedHours: Math.round(avgEstimatedHours * 100) / 100,
            avgActualHours: Math.round(avgActualHours * 100) / 100,
        };
    }

    async getUsersActivity(organizationId: string) {
        const users = await this.prisma.user.findMany({
            where: { organizationId, isActive: true },
            include: {
                _count: {
                    select: {
                        assignedTasks: true,
                        reportedTasks: true,
                        projects: true,
                    },
                },
            },
        });

        return users.map((user) => ({
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            lastLoginAt: user.lastLoginAt,
            assignedTasks: user._count.assignedTasks,
            reportedTasks: user._count.reportedTasks,
            projectsOwned: user._count.projects,
        }));
    }

    async getSprintVelocity(organizationId: string, projectId?: string) {
        const where: any = { organizationId };
        if (projectId) where.projectId = projectId;

        const sprints = await this.prisma.sprint.findMany({
            where,
            include: {
                tasks: {
                    where: { status: 'DONE' },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { startDate: 'desc' },
            take: 10,
        });

        const velocityData = sprints.map((sprint) => {
            const completedStoryPoints = sprint.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
            return {
                sprintId: sprint.id,
                sprintName: sprint.name,
                projectName: sprint.project.name,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                completedTasks: sprint.tasks.length,
                completedStoryPoints,
            };
        });

        const avgVelocity =
            velocityData.reduce((sum, s) => sum + s.completedStoryPoints, 0) / velocityData.length || 0;

        return {
            sprints: velocityData,
            averageVelocity: Math.round(avgVelocity * 100) / 100,
        };
    }
}
