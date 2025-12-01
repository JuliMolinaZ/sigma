import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { FinancialGuard } from '../../../common/guards/financial.guard';

@Controller('finance/purchase-orders')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard, FinancialGuard)
export class PurchaseOrdersController {
    constructor(private readonly service: PurchaseOrdersService) { }

    @Post()
    @Permissions('finance:create')
    create(@Request() req, @Body() createDto: CreatePurchaseOrderDto) {
        return this.service.create(req.user.organizationId, req.user.id, createDto);
    }

    @Get()
    @Permissions('finance:read')
    findAll(@Request() req, @Query() query: QueryPurchaseOrderDto) {
        return this.service.findAll(req.user.organizationId, query);
    }

    @Get('statistics')
    @Permissions('finance:read')
    getStatistics(@Request() req) {
        return this.service.getStatistics(req.user.organizationId);
    }

    @Get(':id')
    @Permissions('finance:read')
    findOne(@Param('id') id: string, @Request() req) {
        return this.service.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('finance:update')
    update(@Param('id') id: string, @Request() req, @Body() updateDto: UpdatePurchaseOrderDto) {
        return this.service.update(id, req.user.organizationId, updateDto);
    }

    @Delete(':id')
    @Permissions('finance:delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.user.organizationId);
    }

    @Post(':id/submit')
    @Permissions('finance:update')
    submitForApproval(@Param('id') id: string, @Request() req) {
        return this.service.submitForApproval(id, req.user.organizationId);
    }

    @Post(':id/approve')
    @Permissions('finance:approve')
    approve(@Param('id') id: string, @Request() req) {
        return this.service.approve(id, req.user.organizationId, req.user.id);
    }

    @Post(':id/reject')
    @Permissions('finance:approve')
    reject(@Param('id') id: string, @Request() req) {
        return this.service.reject(id, req.user.organizationId, req.user.id);
    }

    @Post(':id/mark-paid')
    @Permissions('finance:update')
    markAsPaid(@Param('id') id: string, @Request() req) {
        return this.service.markAsPaid(id, req.user.organizationId);
    }

    @Get(':id/pdf')
    @Permissions('finance:read')
    async generatePdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
        const pdfBuffer = await this.service.generatePdf(id, req.user.organizationId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=purchase-order-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }
}
