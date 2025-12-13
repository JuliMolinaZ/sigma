import { Module } from '@nestjs/common';
import { DispatchesService } from './dispatches.service';
import { DispatchesController } from './dispatches.controller';
import { PrismaService } from '../../database/prisma.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [WebhooksModule],
    controllers: [DispatchesController],
    providers: [DispatchesService, PrismaService],
    exports: [DispatchesService],
})
export class DispatchesModule { }
