import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SuperadminCeoGuard } from '../../common/guards/superadmin-ceo.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, SuperadminCeoGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    @ApiResponse({ status: 201, description: 'Role created successfully' })
    @ApiResponse({ status: 409, description: 'Role already exists' })
    create(@Request() req, @Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto, req.user.organizationId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all roles for organization' })
    @ApiResponse({ status: 200, description: 'List of roles' })
    findAll(@Request() req) {
        return this.rolesService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID' })
    @ApiResponse({ status: 200, description: 'Role details' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    findOne(@Request() req, @Param('id') id: string) {
        return this.rolesService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update role' })
    @ApiResponse({ status: 200, description: 'Role updated successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    update(@Request() req, @Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, req.user.organizationId, updateRoleDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete role' })
    @ApiResponse({ status: 200, description: 'Role deleted successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 409, description: 'Cannot delete system role or role with users' })
    remove(@Request() req, @Param('id') id: string) {
        return this.rolesService.remove(id, req.user.organizationId);
    }

    @Put(':id/permissions')
    @ApiOperation({ summary: 'Assign permissions to role' })
    @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
    @ApiResponse({ status: 404, description: 'Role or permission not found' })
    assignPermissions(
        @Request() req,
        @Param('id') id: string,
        @Body() assignDto: AssignPermissionsDto,
    ) {
        return this.rolesService.assignPermissions(id, req.user.organizationId, assignDto);
    }

    @Delete(':id/permissions/:permissionId')
    @ApiOperation({ summary: 'Remove permission from role' })
    @ApiResponse({ status: 200, description: 'Permission removed successfully' })
    @ApiResponse({ status: 404, description: 'Role or permission not found' })
    removePermission(
        @Request() req,
        @Param('id') id: string,
        @Param('permissionId') permissionId: string,
    ) {
        return this.rolesService.removePermission(id, req.user.organizationId, permissionId);
    }
}
