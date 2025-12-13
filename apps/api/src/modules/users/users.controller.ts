import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Permissions('users:create')
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    create(@Request() req, @Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto, req.user.organizationId);
    }

    @Get()
    @Permissions('users:read')
    @ApiOperation({ summary: 'Get all users in organization' })
    @ApiResponse({ status: 200, description: 'List of users' })
    findAll(@Request() req) {
        return this.usersService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Permissions('users:read')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User details' })
    @ApiResponse({ status: 404, description: 'User not found' })
    findOne(@Param('id') id: string, @Request() req) {
        return this.usersService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('users:update')
    @ApiOperation({ summary: 'Update user' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @ApiResponse({ status: 403, description: 'Cannot deactivate own account' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
        return this.usersService.update(id, updateUserDto, req.user.organizationId, req.user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Permissions('users:delete')
    @ApiOperation({ summary: 'Delete user (soft delete)' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 403, description: 'Cannot delete own account' })
    remove(@Param('id') id: string, @Request() req) {
        return this.usersService.remove(id, req.user.organizationId, req.user.id);
    }
}
