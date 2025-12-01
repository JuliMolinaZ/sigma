import { Module } from '@nestjs/common';
import { PaymentComplementsService } from './payment-complements.service';
import { PaymentComplementsController } from './payment-complements.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
    controllers: [PaymentComplementsController],
    providers: [PaymentComplementsService, PrismaService],
    exports: [PaymentComplementsService],
})
export class PaymentComplementsModule { }
