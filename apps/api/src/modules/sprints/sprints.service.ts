import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { QuerySprintDto } from './dto/query-sprint.dto';

@Injectable()
export class SprintsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(user: any, createSprintDto: CreateSprintDto) {
        const { id: userId, organizationId, role } = user;

        // RBAC: Check user role
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'GERENTE OPERACIONES'].includes(role?.toUpperCase());
        const isProjectManager = ['PROJECT MANAGER', 'PROJECT_MANAGER'].includes(role?.toUpperCase());

        // Verify project exists and belongs to organization
        const project = await this.prisma.project.findFirst({
            where: {
                id: createSprintDto.projectId,
                organizationId,
                deletedAt: null,
            },
            include: {
                owners: { select: { id: true } },
                members: { select: { id: true } },
            },
        });

        if (!project) {
            throw new BadRequestException('Project not found');
        }

        // Check user's relationship with the project
        const isProjectOwner = project.ownerId === userId;
        const isProjectCoOwner = project.owners?.some(o => o.id === userId);
        const isProjectMember = project.members?.some(m => m.id === userId);

        // Authorization logic:
        // - Admins can create sprints in any project
        // - Project Managers can create sprints in projects where they are owner, co-owner, or member
        // - Others can only create if they are owner or co-owner
        const canCreateSprint = isAdmin ||
            (isProjectManager && (isProjectOwner || isProjectCoOwner || isProjectMember)) ||
            isProjectOwner ||
            isProjectCoOwner;

        if (!canCreateSprint) {
            throw new ForbiddenException('You do not have permission to create sprints in this project');
        }

        // Validate dates
        const startDate = new Date(createSprintDto.startDate);
        const endDate = new Date(createSprintDto.endDate);

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        // Validate members are from the project (Developers/Operators)
        if (createSprintDto.memberIds && createSprintDto.memberIds.length > 0) {
            const members = await this.prisma.user.findMany({
                where: {
                    id: { in: createSprintDto.memberIds },
                    organizationId,
                },
                include: {
                    role: true,
                },
            });

            // Verify all members exist and have appropriate roles
            const validRoles = ['DEVELOPER', 'OPERARIO', 'OPERATOR', 'DEV'];
            const invalidMembers = members.filter(m => {
                const roleName = m.role?.name?.toUpperCase();
                return !validRoles.includes(roleName);
            });

            if (invalidMembers.length > 0) {
                throw new BadRequestException('Only Developers and Operators can be assigned to sprints');
            }
        }

        const { memberIds, ...sprintData } = createSprintDto;

        return this.prisma.sprint.create({
            data: {
                ...sprintData,
                startDate, // Use parsed Date object
                endDate,   // Use parsed Date object
                organizationId,
                members: memberIds && memberIds.length > 0
                    ? { connect: memberIds.map(id => ({ id })) }
                    : undefined,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
    }

    async findAll(user: any, query: QuerySprintDto) {
        const { organizationId, id: userId, role } = user;
        const { projectId, startDateFrom, startDateTo, page = 1, limit = 20 } = query;

        const skip = (page - 1) * limit;

        const where: any = {
            organizationId,
        };

        // RBAC: If not Admin, restrict to projects they have access to
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'SUPERADMINISTRATOR', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES'].includes(role?.toUpperCase());

        if (!isAdmin) {
            // Get projects user has access to
            const accessibleProjects = await this.prisma.project.findMany({
                where: {
                    organizationId,
                    deletedAt: null,
                    OR: [
                        { ownerId: userId },
                        { owners: { some: { id: userId } } },
                        { members: { some: { id: userId } } },
                        { tasks: { some: { assigneeId: userId } } },
                    ],
                },
                select: { id: true },
            });

            const accessibleProjectIds = accessibleProjects.map(p => p.id);

            if (accessibleProjectIds.length === 0) {
                // User has no accessible projects, return empty
                return {
                    data: [],
                    meta: { total: 0, page, limit, totalPages: 0 },
                };
            }

            where.projectId = { in: accessibleProjectIds };
        }

        if (projectId) {
            // Override with specific project if provided
            where.projectId = projectId;
        }

        if (startDateFrom || startDateTo) {
            where.startDate = {};
            if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
            if (startDateTo) where.startDate.lte = new Date(startDateTo);
        }

        const [sprints, total] = await Promise.all([
            this.prisma.sprint.findMany({
                where,
                skip,
                take: limit,
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                        },
                    },
                    members: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                            role: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
                orderBy: {
                    startDate: 'desc',
                },
            }),
            this.prisma.sprint.count({ where }),
        ]);

        return {
            data: sprints,
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

        const sprint = await this.prisma.sprint.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                project: {
                    include: {
                        owners: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                        members: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: {
                        position: 'asc',
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });

        if (!sprint) {
            throw new NotFoundException('Sprint not found');
        }

        // RBAC Check
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'SUPERADMINISTRATOR', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES'].includes(role?.toUpperCase());

        if (!isAdmin) {
            // Check if user has access to the project
            const isOwner = sprint.project.ownerId === userId || sprint.project.owners.some(o => o.id === userId);
            const isMember = sprint.project.members.some(m => m.id === userId);

            if (!isOwner && !isMember) {
                // Check if has assigned tasks in this sprint
                const hasAssignedTasks = sprint.tasks.some(t => t.assigneeId === userId);

                if (!hasAssignedTasks) {
                    throw new ForbiddenException('You do not have permission to view this sprint');
                }
            }
        }

        return sprint;
    }

    async update(id: string, user: any, updateSprintDto: UpdateSprintDto) {
        const { organizationId, id: userId, role } = user;

        const sprint = await this.findOne(id, user);

        // RBAC: Check user role and project relationship
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'GERENTE OPERACIONES'].includes(role?.toUpperCase());
        const isProjectManager = ['PROJECT MANAGER', 'PROJECT_MANAGER'].includes(role?.toUpperCase());
        const isProjectOwner = sprint.project.ownerId === userId;
        const isProjectCoOwner = sprint.project.owners.some(o => o.id === userId);
        const isProjectMember = sprint.project.members.some(m => m.id === userId);

        // Authorization logic: same as create
        const canUpdateSprint = isAdmin ||
            (isProjectManager && (isProjectOwner || isProjectCoOwner || isProjectMember)) ||
            isProjectOwner ||
            isProjectCoOwner;

        if (!canUpdateSprint) {
            throw new ForbiddenException('You do not have permission to update this sprint');
        }

        // Validate dates if provided
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (updateSprintDto.startDate) {
            startDate = new Date(updateSprintDto.startDate);
        }
        if (updateSprintDto.endDate) {
            endDate = new Date(updateSprintDto.endDate);
        }

        // If both provided, validate range
        if (startDate && endDate) {
            if (endDate <= startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        } else if (startDate && !endDate) {
            // Check against existing end date
            const existingEndDate = new Date(sprint.endDate);
            if (existingEndDate <= startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        } else if (!startDate && endDate) {
            // Check against existing start date
            const existingStartDate = new Date(sprint.startDate);
            if (endDate <= existingStartDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }

        // Validate members if updating
        if (updateSprintDto.memberIds !== undefined) {
            if (updateSprintDto.memberIds.length > 0) {
                const members = await this.prisma.user.findMany({
                    where: {
                        id: { in: updateSprintDto.memberIds },
                        organizationId,
                    },
                    include: {
                        role: true,
                    },
                });

                const validRoles = ['DEVELOPER', 'OPERARIO', 'OPERATOR', 'DEV'];
                const invalidMembers = members.filter(m => {
                    const roleName = m.role?.name?.toUpperCase();
                    return !validRoles.includes(roleName);
                });

                if (invalidMembers.length > 0) {
                    throw new BadRequestException('Only Developers and Operators can be assigned to sprints');
                }
            }
        }

        const { memberIds, ...sprintData } = updateSprintDto;

        return this.prisma.sprint.update({
            where: { id },
            data: {
                ...sprintData,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                members: memberIds !== undefined
                    ? {
                        set: memberIds.map(id => ({ id }))
                    }
                    : undefined,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
    }

    async remove(id: string, user: any) {
        const { organizationId, id: userId, role } = user;

        const sprint = await this.findOne(id, user);

        // RBAC: Check user role and project relationship
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'GERENTE OPERACIONES'].includes(role?.toUpperCase());
        const isProjectManager = ['PROJECT MANAGER', 'PROJECT_MANAGER'].includes(role?.toUpperCase());
        const isProjectOwner = sprint.project.ownerId === userId;
        const isProjectCoOwner = sprint.project.owners.some(o => o.id === userId);
        const isProjectMember = sprint.project.members.some(m => m.id === userId);

        // Authorization logic: same as create and update
        const canDeleteSprint = isAdmin ||
            (isProjectManager && (isProjectOwner || isProjectCoOwner || isProjectMember)) ||
            isProjectOwner ||
            isProjectCoOwner;

        if (!canDeleteSprint) {
            throw new ForbiddenException('You do not have permission to delete this sprint');
        }

        return this.prisma.sprint.delete({
            where: { id },
        });
    }

    async getBurndown(id: string, user: any) {
        const { organizationId } = user;
        const sprint = await this.findOne(id, user);

        const tasks = await this.prisma.task.findMany({
            where: {
                sprintId: id,
                organizationId,
            },
        });

        const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
        const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
        const totalTasks = tasks.length;

        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const today = new Date();

        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.min(
            Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
            totalDays,
        );

        const idealBurndownRate = totalEstimatedHours / totalDays;
        const idealRemaining = Math.max(0, totalEstimatedHours - idealBurndownRate * daysPassed);

        const completedHours = tasks
            .filter((t) => t.status === 'DONE')
            .reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const actualRemaining = totalEstimatedHours - completedHours;

        // Generate burndown chart data
        const chartData = [];
        for (let day = 0; day <= totalDays; day++) {
            const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
            const idealValue = Math.max(0, totalEstimatedHours - idealBurndownRate * day);

            chartData.push({
                day,
                date: date.toISOString().split('T')[0],
                idealRemaining: Math.round(idealValue * 100) / 100,
                actualRemaining: day === daysPassed ? actualRemaining : null,
            });
        }

        return {
            totalEstimatedHours,
            totalActualHours,
            completedHours,
            remainingHours: actualRemaining,
            totalTasks,
            completedTasks,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            totalDays,
            daysPassed,
            chartData,
        };
    }

    async getVelocity(id: string, user: any) {
        const { organizationId } = user;
        const sprint = await this.findOne(id, user);

        const tasks = await this.prisma.task.findMany({
            where: {
                sprintId: id,
                organizationId,
                status: 'DONE',
            },
        });

        const completedStoryPoints = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

        return {
            sprintId: id,
            sprintName: sprint.name,
            completedTasks: tasks.length,
            completedStoryPoints,
        };
    }

    async getStatistics(id: string, user: any) {
        const { organizationId } = user;
        const sprint = await this.findOne(id, user);

        const taskStats = await this.prisma.task.groupBy({
            by: ['status'],
            where: {
                sprintId: id,
                organizationId,
            },
            _count: true,
        });

        const totalTasks = taskStats.reduce((acc, stat) => acc + stat._count, 0);
        const completedTasks = taskStats.find((s) => s.status === 'DONE')?._count || 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate estimated vs actual hours
        const tasks = await this.prisma.task.findMany({
            where: {
                sprintId: id,
                organizationId,
            },
            select: {
                estimatedHours: true,
                actualHours: true,
                status: true,
            },
        });

        const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);

        return {
            totalTasks,
            completedTasks,
            progress: Math.round(progress * 100) / 100,
            tasksByStatus: taskStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count;
                return acc;
            }, {}),
            totalEstimatedHours,
            totalActualHours,
            hoursVariance: totalActualHours - totalEstimatedHours,
        };
    }
}
