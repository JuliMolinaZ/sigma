import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    @Permissions('roles:create')
    create(@Request() req, @Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto, req.user.organizationId);
    }

    @Get()
    @Permissions('roles:read')
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @Permissions('roles:read')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @Patch(':id')
    @Permissions('roles:update')
    update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    @Permissions('roles:delete')
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
