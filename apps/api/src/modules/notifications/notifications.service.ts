import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

export interface EmailNotificationPayload {
    to: string;
    subject: string;
    template: string;
    data: any;
}

export interface InAppNotificationPayload {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectQueue('email') private emailQueue: Queue,
        @InjectQueue('notifications') private notificationsQueue: Queue,
        private readonly prisma: PrismaService,
    ) {}

    async sendEmail(payload: EmailNotificationPayload) {
        await this.emailQueue.add('send-email', payload, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }

    async createInAppNotification(payload: InAppNotificationPayload) {
        await this.notificationsQueue.add('in-app-notification', payload);
    }

    async notifyTaskAssigned(taskId: string, assigneeId: string, assignedBy: string) {
        const [task, assignee, assigner] = await Promise.all([
            this.prisma.task.findUnique({
                where: { id: taskId },
                include: { project: true },
            }),
            this.prisma.user.findUnique({ where: { id: assigneeId } }),
            this.prisma.user.findUnique({ where: { id: assignedBy } }),
        ]);

        if (!task || !assignee || !assigner) return;

        // Send email
        await this.sendEmail({
            to: assignee.email,
            subject: `New Task Assigned: ${task.title}`,
            template: 'task-assigned',
            data: {
                assigneeName: assignee.firstName,
                taskTitle: task.title,
                projectName: task.project.name,
                assignedByName: `${assigner.firstName} ${assigner.lastName}`,
            },
        });

        // Create in-app notification
        await this.createInAppNotification({
            userId: assigneeId,
            title: 'New Task Assigned',
            message: `${assigner.firstName} assigned you "${task.title}"`,
            type: 'TASK_ASSIGNED',
            link: `/projects/${task.projectId}/tasks/${taskId}`,
        });
    }

    async notifyProjectCreated(projectId: string, ownerId: string) {
        const [project, owner] = await Promise.all([
            this.prisma.project.findUnique({ where: { id: projectId } }),
            this.prisma.user.findUnique({ where: { id: ownerId } }),
        ]);

        if (!project || !owner) return;

        await this.sendEmail({
            to: owner.email,
            subject: `Project Created: ${project.name}`,
            template: 'project-created',
            data: {
                ownerName: owner.firstName,
                projectName: project.name,
            },
        });
    }
}
