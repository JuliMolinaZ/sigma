import { Module } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [SprintsController],
    providers: [SprintsService, PrismaService],
    exports: [SprintsService],
})
export class SprintsModule {}
