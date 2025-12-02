import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentComplementsService } from './payment-complements.service';
import { CreatePaymentComplementDto } from './dto/create-payment-complement.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('finance/payment-complements')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentComplementsController {
    constructor(private readonly paymentComplementsService: PaymentComplementsService) { }

    @Post()
    create(@Request() req, @Body() createDto: CreatePaymentComplementDto) {
        return this.paymentComplementsService.create(req.user.organizationId, createDto);
    }

    @Get('ar/:arId')
    findAllByAr(@Request() req, @Param('arId') arId: string) {
        return this.paymentComplementsService.findAllByAr(req.user.organizationId, arId);
    }

    @Get('ap/:apId')
    findAllByAp(@Request() req, @Param('apId') apId: string) {
        return this.paymentComplementsService.findAllByAp(req.user.organizationId, apId);
    }

    @Get()
    findAll(@Request() req) {
        return this.paymentComplementsService.findAll(req.user.organizationId);
    }

    @Get('client/:clientId')
    findAllByClient(@Request() req, @Param('clientId') clientId: string) {
        return this.paymentComplementsService.findAllByClient(req.user.organizationId, clientId);
    }

    @Get('supplier/:supplierId')
    findAllBySupplier(@Request() req, @Param('supplierId') supplierId: string) {
        return this.paymentComplementsService.findAllBySupplier(req.user.organizationId, supplierId);
    }
}
