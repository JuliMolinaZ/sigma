import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Permissions('users:create')
    create(@Request() req, @Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto, req.user.organizationId);
    }

    @Get()
    @Permissions('users:read')
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Permissions('users:read')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @Permissions('users:update')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Permissions('users:delete')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
