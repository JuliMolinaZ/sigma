import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { EmailProcessor } from './processors/email.processor';
import { PrismaService } from '../../database/prisma.service';

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: 'email',
            },
            {
                name: 'notifications',
            },
        ),
    ],
    providers: [NotificationsService, EmailProcessor, PrismaService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
