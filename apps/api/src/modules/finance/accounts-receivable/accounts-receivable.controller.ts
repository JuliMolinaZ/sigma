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
} from '@nestjs/common';
import { AccountsReceivableService } from './accounts-receivable.service';
import { CreateAccountReceivableDto } from './dto/create-ar.dto';
import { UpdateAccountReceivableDto } from './dto/update-ar.dto';
import { QueryAccountReceivableDto } from './dto/query-ar.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { FinancialGuard } from '../../../common/guards/financial.guard';

@Controller('finance/ar')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard, FinancialGuard)
export class AccountsReceivableController {
    constructor(private readonly service: AccountsReceivableService) { }

    @Post()
    @Permissions('finance:create')
    create(@Request() req, @Body() createDto: CreateAccountReceivableDto) {
        return this.service.create(req.user.organizationId, createDto);
    }

    @Get()
    @Permissions('finance:read')
    findAll(@Request() req, @Query() query: QueryAccountReceivableDto) {
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
    update(@Param('id') id: string, @Request() req, @Body() updateDto: UpdateAccountReceivableDto) {
        return this.service.update(id, req.user.organizationId, updateDto);
    }

    @Delete(':id')
    @Permissions('finance:delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.user.organizationId);
    }
}
