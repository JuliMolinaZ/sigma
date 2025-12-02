import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { PatchDispatchDto } from './dto/patch-dispatch.dto';
import { QueryDispatchDto } from './dto/query-dispatch.dto';
import { DispatchStatus, TaskPriority, User, Role, UrgencyLevel, Prisma } from '@prisma/client';

// Types
type RequestUser = User & { role: Role };

// Constants
const EXECUTIVE_ROLES = [
    'SUPERADMIN',
    'SUPER_ADMIN',
    'ADMINISTRATOR',
    'CEO',
    'CFO',
    'CTO',
    'COO',
    'CCO',
    'GERENTE OPERACIONES',
    'GERENTE',
    'MANAGER'
];

const USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    avatarUrl: true,
    role: {
        select: {
            name: true,
        },
    },
};

@Injectable()
export class DispatchesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(user: RequestUser, createDispatchDto: CreateDispatchDto) {
        const { id: userId, organizationId } = user;

        // Verify recipient exists and is in same organization
        const recipient = await this.prisma.user.findFirst({
            where: {
                id: createDispatchDto.recipientId,
                organizationId,
                isActive: true,
            },
        });

        if (!recipient) {
            throw new BadRequestException('Recipient not found or inactive');
        }

        // Create dispatch
        return this.prisma.dispatch.create({
            data: {
                content: createDispatchDto.content,
                description: createDispatchDto.description,
                link: createDispatchDto.link,
                urgencyLevel: createDispatchDto.urgencyLevel || UrgencyLevel.NORMAL,
                dueDate: createDispatchDto.dueDate
                    ? new Date(createDispatchDto.dueDate)
                    : null,
                senderId: userId,
                recipientId: createDispatchDto.recipientId,
                organizationId,
                status: DispatchStatus.SENT,
            },
            include: {
                sender: { select: USER_SELECT },
                recipient: { select: USER_SELECT },
                attachments: true,
            },
        });
    }

    async findAll(user: RequestUser, query: QueryDispatchDto) {
        const { id: userId, organizationId } = user;
        const { page = 1, limit = 20, status, urgencyLevel, type } = query;

        const skip = (page - 1) * limit;

        const where: Prisma.DispatchWhereInput = {
            organizationId,
        };

        // Filter by type (sent or received)
        if (type === 'sent') {
            where.senderId = userId;
        } else if (type === 'received') {
            where.recipientId = userId;
        } else {
            // Default: show both sent and received
            where.OR = [{ senderId: userId }, { recipientId: userId }];
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by urgency
        if (urgencyLevel) {
            where.urgencyLevel = urgencyLevel;
        }

        const [dispatches, total] = await Promise.all([
            this.prisma.dispatch.findMany({
                where,
                skip,
                take: limit,
                include: {
                    sender: { select: USER_SELECT },
                    recipient: { select: USER_SELECT },
                    task: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                    _count: {
                        select: {
                            attachments: true,
                        },
                    },
                },
                orderBy: [
                    { urgencyLevel: 'desc' }, // CRITICAL first
                    { createdAt: 'desc' },
                ],
            }),
            this.prisma.dispatch.count({ where }),
        ]);

        return {
            data: dispatches,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, user: RequestUser) {
        const { id: userId, organizationId } = user;

        const dispatch = await this.prisma.dispatch.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                sender: { select: USER_SELECT },
                recipient: { select: USER_SELECT },
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
                attachments: true,
            },
        });

        if (!dispatch) {
            throw new NotFoundException('Dispatch not found');
        }

        // RBAC: Only sender or recipient can view
        if (dispatch.senderId !== userId && dispatch.recipientId !== userId) {
            throw new ForbiddenException('You do not have permission to view this dispatch');
        }

        return dispatch;
    }

    async patch(id: string, user: RequestUser, patchDispatchDto: PatchDispatchDto) {
        const dispatch = await this.findOne(id, user);

        // Only recipient can update status
        if (dispatch.recipientId !== user.id) {
            throw new ForbiddenException('Only the recipient can update dispatch status');
        }

        return this.prisma.dispatch.update({
            where: { id },
            data: {
                ...patchDispatchDto,
                dueDate: patchDispatchDto.dueDate
                    ? new Date(patchDispatchDto.dueDate)
                    : undefined,
            },
            include: {
                sender: { select: USER_SELECT },
                recipient: { select: USER_SELECT },
                attachments: true,
            },
        });
    }

    async remove(id: string, user: RequestUser) {
        const dispatch = await this.findOne(id, user);

        // Check if user is Super Admin
        const isSuperAdmin = EXECUTIVE_ROLES.includes(
            user.role?.name?.toUpperCase() || ''
        );

        // Super Admin can delete any dispatch
        if (isSuperAdmin) {
            await this.prisma.dispatch.delete({
                where: { id },
            });
            return { message: 'Dispatch deleted successfully by Super Admin' };
        }

        // Regular users: only sender can delete
        if (dispatch.senderId !== user.id) {
            throw new ForbiddenException('Only the sender can delete this dispatch');
        }

        await this.prisma.dispatch.delete({
            where: { id },
        });

        return { message: 'Dispatch deleted successfully' };
    }

    async markAsRead(id: string, user: RequestUser) {
        const dispatch = await this.findOne(id, user);

        if (dispatch.recipientId !== user.id) {
            throw new ForbiddenException('Only the recipient can mark as read');
        }

        if (dispatch.status !== DispatchStatus.SENT) {
            throw new BadRequestException('Dispatch has already been read');
        }

        return this.prisma.dispatch.update({
            where: { id },
            data: {
                status: DispatchStatus.READ,
                readAt: new Date(),
            },
            include: {
                sender: true,
                recipient: true,
            },
        });
    }

    async markInProgress(id: string, user: RequestUser) {
        const dispatch = await this.findOne(id, user);

        if (dispatch.recipientId !== user.id) {
            throw new ForbiddenException('Only the recipient can mark as in progress');
        }

        if (dispatch.status === DispatchStatus.RESOLVED || dispatch.status === DispatchStatus.CONVERTED_TO_TASK) {
            throw new BadRequestException('Cannot change status of resolved or converted dispatch');
        }

        return this.prisma.dispatch.update({
            where: { id },
            data: {
                status: DispatchStatus.IN_PROGRESS,
                inProgressAt: new Date(),
                readAt: dispatch.readAt || new Date(), // Auto-mark as read if not already
            },
            include: {
                sender: true,
                recipient: true,
            },
        });
    }

    async resolve(id: string, user: RequestUser, resolutionNote?: string) {
        const dispatch = await this.findOne(id, user);

        if (dispatch.recipientId !== user.id) {
            throw new ForbiddenException('Only the recipient can resolve a dispatch');
        }

        if (dispatch.status === DispatchStatus.CONVERTED_TO_TASK) {
            throw new BadRequestException('Cannot resolve a dispatch that was converted to a task');
        }

        return this.prisma.dispatch.update({
            where: { id },
            data: {
                status: DispatchStatus.RESOLVED,
                resolvedAt: new Date(),
                resolutionNote,
                readAt: dispatch.readAt || new Date(),
            },
            include: {
                sender: true,
                recipient: true,
            },
        });
    }

    async convertToTask(id: string, user: RequestUser, projectId?: string) {
        const dispatch = await this.findOne(id, user);

        if (dispatch.recipientId !== user.id && dispatch.senderId !== user.id) {
            throw new ForbiddenException('Only sender or recipient can convert to task');
        }

        if (dispatch.status === DispatchStatus.CONVERTED_TO_TASK) {
            throw new BadRequestException('Dispatch has already been converted to a task');
        }

        if (dispatch.taskId) {
            throw new BadRequestException('Dispatch is already linked to a task');
        }

        // Map urgency to priority
        const priorityMap: Record<string, TaskPriority> = {
            [UrgencyLevel.CRITICAL]: TaskPriority.CRITICAL,
            [UrgencyLevel.URGENT]: TaskPriority.HIGH,
            [UrgencyLevel.NORMAL]: TaskPriority.MEDIUM,
        };

        const isExecutive = EXECUTIVE_ROLES.includes(
            user.role?.name?.toUpperCase() || ''
        );

        // Build project query
        const projectWhere: Prisma.ProjectWhereInput = {
            organizationId: user.organizationId,
            deletedAt: null,
        };

        if (projectId) {
            projectWhere.id = projectId;
        }

        if (!isExecutive) {
            // Regular users: verify recipient is member of the project
            projectWhere.OR = [
                { ownerId: dispatch.recipientId },
                { members: { some: { id: dispatch.recipientId } } },
            ];
        }

        const selectedProject = await this.prisma.project.findFirst({
            where: projectWhere,
        });

        if (!selectedProject) {
            if (projectId) {
                throw new BadRequestException(
                    isExecutive
                        ? 'Invalid project'
                        : 'Invalid project or recipient is not a member of the selected project'
                );
            } else {
                throw new BadRequestException(
                    isExecutive
                        ? 'No projects available in organization'
                        : 'Recipient must be assigned to at least one project to convert dispatch to task'
                );
            }
        }

        // Create task and update dispatch in a transaction
        return this.prisma.$transaction(async (tx) => {
            // Create task
            const task = await tx.task.create({
                data: {
                    title: dispatch.content.substring(0, 100), // Limit title length
                    description: dispatch.content,
                    status: 'TODO',
                    priority: priorityMap[dispatch.urgencyLevel] || TaskPriority.MEDIUM,
                    projectId: selectedProject.id,
                    assigneeId: dispatch.recipientId,
                    reporterId: dispatch.senderId,
                    dueDate: dispatch.dueDate,
                    organizationId: user.organizationId,
                    sourceDispatchId: dispatch.id,
                },
            });

            // Update dispatch
            const updatedDispatch = await tx.dispatch.update({
                where: { id },
                data: {
                    status: DispatchStatus.CONVERTED_TO_TASK,
                    taskId: task.id,
                },
                include: {
                    sender: true,
                    recipient: true,
                    task: true,
                },
            });

            return { task, dispatch: updatedDispatch };
        });
    }

    async getStats(user: RequestUser) {
        const { id: userId, organizationId } = user;

        const [totalSent, totalReceived, unreadCount, urgentCount] = await Promise.all([
            this.prisma.dispatch.count({
                where: {
                    senderId: userId,
                    organizationId,
                },
            }),
            this.prisma.dispatch.count({
                where: {
                    recipientId: userId,
                    organizationId,
                },
            }),
            this.prisma.dispatch.count({
                where: {
                    recipientId: userId,
                    organizationId,
                    status: DispatchStatus.SENT,
                },
            }),
            this.prisma.dispatch.count({
                where: {
                    recipientId: userId,
                    organizationId,
                    urgencyLevel: UrgencyLevel.URGENT,
                    status: {
                        in: [DispatchStatus.SENT, DispatchStatus.READ, DispatchStatus.IN_PROGRESS],
                    },
                },
            }),
        ]);

        return {
            totalSent,
            totalReceived,
            unreadCount,
            urgentCount,
        };
    }
}
