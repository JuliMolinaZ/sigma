import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { ChangeProjectStatusDto } from './dto/change-status.dto';
import { ProjectStatus } from '@prisma/client';
import { EXECUTIVE_ROLES } from '../../common/constants/roles.constants';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(user: any, createProjectDto: CreateProjectDto) {
        const { id: userId, organizationId, role } = user;

        // RBAC: Only Executives can create projects
        const canCreate = EXECUTIVE_ROLES.includes(role?.toUpperCase());
        if (!canCreate) {
            throw new ForbiddenException('Only Executives can create new projects');
        }

        // Extract relation fields first before destructuring
        const memberIds = createProjectDto.memberIds;
        const dtoOwnerIds = createProjectDto.ownerIds;
        const dtoOwnerId = createProjectDto.ownerId;
        const dtoStartDate = createProjectDto.startDate;
        const dtoEndDate = createProjectDto.endDate;

        // Exclude fields that are handled separately (relations)
        const { memberIds: _, ownerIds: __, ownerId: ___, startDate: ____, endDate: _____, ...projectData } = createProjectDto;

        const ownerIds = dtoOwnerIds || (dtoOwnerId ? [dtoOwnerId] : [userId]);

        // Verify owners belong to organization
        const owners = await this.prisma.user.findMany({
            where: {
                id: { in: ownerIds },
                organizationId,
                isActive: true,
            },
        });

        if (owners.length === 0) {
            throw new BadRequestException('No valid owners found in this organization');
        }

        return this.prisma.project.create({
            data: {
                ...projectData,
                startDate: dtoStartDate ? new Date(dtoStartDate) : undefined,
                endDate: dtoEndDate ? new Date(dtoEndDate) : undefined,
                ownerId: ownerIds[0], // Primary owner (PM)
                owners: {
                    connect: owners.map(o => ({ id: o.id }))
                },
                members: memberIds && memberIds.length > 0 ? {
                    connect: memberIds.map(id => ({ id }))
                } : undefined,
                organizationId,
            },
            include: {
                owners: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        nombre: true,
                        contacto: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        sprints: true,
                    },
                },
            },
        });
    }

    async findAll(user: any, query: QueryProjectDto) {
        const { organizationId, id: userId, role } = user;
        const { status, startDateFrom, startDateTo, endDateFrom, endDateTo, search, page = 1, limit = 20 } = query;
        console.log(`[ProjectsService.findAll] User: ${user.email}, Role: ${role}, Org: ${organizationId}`);


        const skip = (page - 1) * limit;

        const where: any = {
            organizationId,
            deletedAt: null,
        };

        // RBAC: If not Admin/Super Admin, restrict to assigned projects
        // Project Managers should only see their own projects
        const isAdmin = EXECUTIVE_ROLES.includes(role?.toUpperCase());
        if (!isAdmin) {
            where.OR = [
                { ownerId: userId }, // Primary Project Owner
                { owners: { some: { id: userId } } }, // Co-Owner
                { members: { some: { id: userId } } }, // Team Member
                {
                    tasks: {
                        some: {
                            assigneeId: userId // Assigned to a task
                        }
                    }
                },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (startDateFrom || startDateTo) {
            where.startDate = {};
            if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
            if (startDateTo) where.startDate.lte = new Date(startDateTo);
        }

        if (endDateFrom || endDateTo) {
            where.endDate = {};
            if (endDateFrom) where.endDate.gte = new Date(endDateFrom);
            if (endDateTo) where.endDate.lte = new Date(endDateTo);
        }

        if (search) {
            const searchCondition = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];

            if (where.OR) {
                // Combine existing RBAC OR with Search OR using AND
                where.AND = [
                    { OR: where.OR },
                    { OR: searchCondition }
                ];
                delete where.OR;
            } else {
                where.OR = searchCondition;
            }
        }

        const [projects, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                skip,
                take: limit,
                include: {
                    owner: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    owners: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    members: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    client: {
                        select: {
                            id: true,
                            nombre: true,
                            contacto: true,
                        },
                    },
                    phase: true,
                    _count: {
                        select: {
                            tasks: true,
                            sprints: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.project.count({ where }),
        ]);

        return {
            data: projects,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, user: any) {
        const { organizationId, id: userId, role } = user;

        const project = await this.prisma.project.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
            include: {
                owners: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        role: { select: { name: true } }
                    },
                },
                sprints: {
                    orderBy: { startDate: 'desc' },
                    take: 5,
                },
                tasks: {
                    where: {},
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        sprints: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        telefono: true,
                        contacto: true,
                    },
                },
                phase: true,
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // RBAC Check
        const isAdmin = EXECUTIVE_ROLES.includes(role?.toUpperCase());
        if (!isAdmin) {
            // Check if owner (primary or co-owner)
            const isOwner = project.ownerId === userId || project.owners.some(o => o.id === userId);
            // Check if member
            const isMember = project.members.some(m => m.id === userId);

            if (!isOwner && !isMember) {
                // Check if has assigned tasks
                const hasAssignedTasks = await this.prisma.task.findFirst({
                    where: {
                        projectId: id,
                        assigneeId: userId,
                    },
                    select: { id: true }
                });

                if (!hasAssignedTasks) {
                    throw new ForbiddenException('You do not have permission to view this project');
                }
            }
        }

        return project;
    }

    async update(id: string, user: any, updateProjectDto: UpdateProjectDto) {
        const { organizationId, role } = user;

        // RBAC: Only Executives can edit projects (Name, Description, Dates, Owner, etc.)
        const isExecutive = EXECUTIVE_ROLES.includes(role?.toUpperCase());
        if (!isExecutive) {
            throw new ForbiddenException('Only Executives can edit projects');
        }

        const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
        if (!project) throw new NotFoundException('Project not found');

        const { ownerIds, ownerId, startDate, endDate, memberIds, clientId, phaseId, ...rest } = updateProjectDto;
        const data: any = { ...rest };

        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);

        if (ownerIds) {
            const owners = await this.prisma.user.findMany({
                where: {
                    id: { in: ownerIds },
                    organizationId,
                    isActive: true,
                },
            });

            if (owners.length === 0) {
                throw new BadRequestException('No valid owners found in this organization');
            }

            data.owners = {
                set: owners.map(o => ({ id: o.id }))
            };
            // Do not set ownerId directly to avoid "Unknown argument" error
            // The relation update might handle it or we might need to connect 'owner' relation separately
            // However, since 'owner' relation uses 'ownerId' field, setting 'ownerId' should work IF 'owner' relation is not also being set?
            // Actually, the error suggests ownerId is NOT in the update input.
            // Let's try connecting the single owner relation if we want to update the primary owner.
            data.owner = { connect: { id: owners[0].id } };
        } else if (ownerId) {
            // Fallback for single owner update
            const owner = await this.prisma.user.findFirst({
                where: { id: ownerId, organizationId, isActive: true }
            });
            if (!owner) throw new BadRequestException('Owner not found');

            // data.ownerId = ownerId; // Remove this
            data.owner = { connect: { id: ownerId } };
            data.owners = {
                set: [{ id: ownerId }]
            };
        }

        if (memberIds) {
            data.members = {
                set: memberIds.map(id => ({ id }))
            };
        }

        if (clientId) {
            data.client = { connect: { id: clientId } };
        }

        if (phaseId) {
            data.phase = { connect: { id: phaseId } };
        }

        return this.prisma.project.update({
            where: { id },
            data,
            include: {
                owners: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        nombre: true,
                        contacto: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        sprints: true,
                    },
                },
            },
        });
    }

    async remove(id: string, organizationId: string) {
        const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
        if (!project) throw new NotFoundException('Project not found');

        // Soft delete
        return this.prisma.project.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    async changeStatus(id: string, organizationId: string, changeStatusDto: ChangeProjectStatusDto) {
        const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
        if (!project) throw new NotFoundException('Project not found');

        return this.prisma.project.update({
            where: { id },
            data: {
                status: changeStatusDto.status,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async getStatistics(id: string, organizationId: string) {
        // Ensure project exists
        const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
        if (!project) throw new NotFoundException('Project not found');

        const [taskStats, sprintStats] = await Promise.all([
            this.prisma.task.groupBy({
                by: ['status'],
                where: {
                    projectId: id,
                    organizationId,
                },
                _count: true,
            }),
            this.prisma.sprint.count({
                where: {
                    projectId: id,
                    organizationId,
                },
            }),
        ]);

        const totalTasks = taskStats.reduce((acc, stat) => acc + stat._count, 0);
        const completedTasks = taskStats.find((s) => s.status === 'DONE')?._count || 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
            totalTasks,
            completedTasks,
            progress: Math.round(progress * 100) / 100,
            tasksByStatus: taskStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count;
                return acc;
            }, {}),
            totalSprints: sprintStats,
        };
    }
    async getFinancialStats(id: string, user: any) {
        const { organizationId, role } = user;

        // RBAC: Check if user is Admin/Executive
        const isAdmin = EXECUTIVE_ROLES.includes(role?.toUpperCase());

        try {
            // Ensure project exists first
            const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
            if (!project) throw new NotFoundException('Project not found');

            // Always fetch time entries (hours)
            const timeEntriesPromise = this.prisma.timeEntry.aggregate({
                where: { projectId: id, organizationId },
                _sum: { hours: true },
            });

            // Only fetch financial data if admin
            const expensesPromise = isAdmin ? this.prisma.expense.aggregate({
                where: { projectId: id, organizationId },
                _sum: { amount: true },
            }) : Promise.resolve({ _sum: { amount: 0 } });

            const receivablesPromise = isAdmin ? this.prisma.accountReceivable.aggregate({
                where: { projectId: id, organizationId },
                _sum: { monto: true, montoPagado: true },
            }) : Promise.resolve({ _sum: { monto: 0, montoPagado: 0 } });

            const [expenses, receivables, timeEntries] = await Promise.all([
                expensesPromise,
                receivablesPromise,
                timeEntriesPromise
            ]);

            const totalExpenses = Number(expenses._sum.amount || 0);
            const totalInvoiced = Number(receivables._sum.monto || 0);
            const totalPaid = Number(receivables._sum.montoPagado || 0);
            const totalHours = Number(timeEntries._sum.hours || 0);

            // Calculate profit (Simplified: Invoiced - Expenses)
            const profit = totalInvoiced - totalExpenses;
            const margin = totalInvoiced > 0 ? (profit / totalInvoiced) * 100 : 0;

            return {
                totalExpenses,
                totalInvoiced,
                totalPaid,
                totalHours,
                profit,
                margin: Math.round(margin * 100) / 100,
                outstandingAmount: totalInvoiced - totalPaid,
            };
        } catch (error) {
            console.error('Error getting financial stats:', error);
            // Return zeroed stats instead of crashing
            return {
                totalExpenses: 0,
                totalInvoiced: 0,
                totalPaid: 0,
                totalHours: 0,
                profit: 0,
                margin: 0,
                outstandingAmount: 0,
            };
        }
    }
}
