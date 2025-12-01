import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [SuppliersController],
    providers: [SuppliersService, PrismaService],
    exports: [SuppliersService],
})
export class SuppliersModule { }
