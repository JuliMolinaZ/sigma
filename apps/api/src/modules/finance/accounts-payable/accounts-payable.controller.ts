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
import { AccountsPayableService } from './accounts-payable.service';
import { CreateAccountPayableDto } from './dto/create-ap.dto';
import { UpdateAccountPayableDto } from './dto/update-ap.dto';
import { QueryAccountPayableDto } from './dto/query-ap.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { FinancialGuard } from '../../../common/guards/financial.guard';

@Controller('finance/ap')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard, FinancialGuard)
export class AccountsPayableController {
    constructor(private readonly service: AccountsPayableService) { }

    @Post()
    @Permissions('finance:create')
    create(@Request() req, @Body() createDto: CreateAccountPayableDto) {
        return this.service.create(req.user.organizationId, createDto);
    }

    @Get()
    @Permissions('finance:read')
    findAll(@Request() req, @Query() query: QueryAccountPayableDto) {
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
    update(@Param('id') id: string, @Request() req, @Body() updateDto: UpdateAccountPayableDto) {
        return this.service.update(id, req.user.organizationId, updateDto);
    }

    @Delete(':id')
    @Permissions('finance:delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.user.organizationId);
    }
}
