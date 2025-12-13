import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SuperadminCeoGuard } from '../../common/guards/superadmin-ceo.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, TenantGuard, SuperadminCeoGuard)
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new permission' })
    @ApiResponse({ status: 201, description: 'Permission created successfully' })
    @ApiResponse({ status: 409, description: 'Permission already exists' })
    create(@Body() createDto: CreatePermissionDto) {
        return this.permissionsService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all permissions' })
    @ApiQuery({ name: 'resource', required: false, description: 'Filter by resource' })
    @ApiResponse({ status: 200, description: 'List of permissions' })
    findAll(@Query('resource') resource?: string) {
        if (resource) {
            return this.permissionsService.findByResource(resource);
        }
        return this.permissionsService.findAll();
    }

    @Get('resources')
    @ApiOperation({ summary: 'Get all unique resources' })
    @ApiResponse({ status: 200, description: 'List of resources' })
    getResources() {
        return this.permissionsService.getResources();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get permission by ID' })
    @ApiResponse({ status: 200, description: 'Permission details' })
    @ApiResponse({ status: 404, description: 'Permission not found' })
    findOne(@Param('id') id: string) {
        return this.permissionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update permission' })
    @ApiResponse({ status: 200, description: 'Permission updated successfully' })
    @ApiResponse({ status: 404, description: 'Permission not found' })
    @ApiResponse({ status: 409, description: 'Permission with same resource and action already exists' })
    update(@Param('id') id: string, @Body() updateDto: UpdatePermissionDto) {
        return this.permissionsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete permission' })
    @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
    @ApiResponse({ status: 404, description: 'Permission not found' })
    @ApiResponse({ status: 409, description: 'Cannot delete permission assigned to roles' })
    remove(@Param('id') id: string) {
        return this.permissionsService.remove(id);
    }
}
