import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { FinancialGuard } from '../../../common/guards/financial.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';

@Controller('finance/journal-entries')
@UseGuards(JwtAuthGuard, TenantGuard, FinancialGuard, PermissionsGuard)
export class JournalEntriesController {
    constructor(private readonly journalEntriesService: JournalEntriesService) { }

    @Post()
    @Permissions('finance:create')
    create(@Request() req, @Body() createJournalEntryDto: CreateJournalEntryDto) {
        return this.journalEntriesService.create(req.user.organizationId, createJournalEntryDto);
    }

    @Get()
    @Permissions('finance:read')
    findAll(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        return this.journalEntriesService.findAll(req.user.organizationId, startDate, endDate);
    }

    @Get(':id')
    @Permissions('finance:read')
    findOne(@Param('id') id: string, @Request() req) {
        return this.journalEntriesService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('finance:update')
    update(@Param('id') id: string, @Request() req, @Body() updateJournalEntryDto: UpdateJournalEntryDto) {
        return this.journalEntriesService.update(id, req.user.organizationId, updateJournalEntryDto);
    }

    @Patch(':id/lock')
    @Permissions('finance:update')
    lock(@Param('id') id: string, @Request() req) {
        return this.journalEntriesService.lock(id, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('finance:delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.journalEntriesService.remove(id, req.user.organizationId);
    }
}
