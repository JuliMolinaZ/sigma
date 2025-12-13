import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    async create(createRoleDto: CreateRoleDto, organizationId: string) {
        const existing = await this.prisma.role.findUnique({
            where: { name_organizationId: { name: createRoleDto.name, organizationId } },
        });
        if (existing) throw new ConflictException('Role already exists');

        return this.prisma.role.create({
            data: {
                ...createRoleDto,
                organization: { connect: { id: organizationId } },
            },
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.role.findMany({
            where: { organizationId },
            include: {
                _count: { select: { users: true } },
                permissions: {
                    include: { permission: true },
                },
            },
            orderBy: { level: 'desc' },
        });
    }

    async findOne(id: string, organizationId: string) {
        const role = await this.prisma.role.findFirst({
            where: { id, organizationId },
            include: {
                permissions: {
                    include: { permission: true },
                    orderBy: { permission: { resource: 'asc' } },
                },
                _count: { select: { users: true } },
            },
        });
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async update(id: string, organizationId: string, updateRoleDto: UpdateRoleDto) {
        const role = await this.findOne(id, organizationId);

        // No permitir cambiar isSystem si es un rol del sistema
        if (role.isSystem && updateRoleDto.isSystem === false) {
            throw new BadRequestException('Cannot change isSystem flag for system roles');
        }

        return this.prisma.role.update({
            where: { id },
            data: updateRoleDto,
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
        });
    }

    async remove(id: string, organizationId: string) {
        const role = await this.findOne(id, organizationId);
        
        if (role.isSystem) {
            throw new ConflictException('Cannot delete system role');
        }

        // Verificar que no tenga usuarios asignados
        const userCount = await this.prisma.user.count({
            where: { roleId: id },
        });

        if (userCount > 0) {
            throw new ConflictException(
                `Cannot delete role. It has ${userCount} user(s) assigned. Please reassign users first.`
            );
        }

        return this.prisma.role.delete({
            where: { id },
        });
    }

    async assignPermissions(id: string, organizationId: string, assignDto: AssignPermissionsDto) {
        const role = await this.findOne(id, organizationId);

        // Verificar que todos los permisos existan
        const permissions = await this.prisma.permission.findMany({
            where: { id: { in: assignDto.permissionIds } },
        });

        if (permissions.length !== assignDto.permissionIds.length) {
            throw new NotFoundException('One or more permissions not found');
        }

        // Eliminar permisos actuales
        await this.prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });

        // Asignar nuevos permisos
        if (assignDto.permissionIds.length > 0) {
            await this.prisma.rolePermission.createMany({
                data: assignDto.permissionIds.map(permissionId => ({
                    roleId: id,
                    permissionId,
                })),
            });
        }

        return this.findOne(id, organizationId);
    }

    async removePermission(id: string, organizationId: string, permissionId: string) {
        const role = await this.findOne(id, organizationId);

        await this.prisma.rolePermission.delete({
            where: {
                roleId_permissionId: {
                    roleId: id,
                    permissionId,
                },
            },
        });

        return this.findOne(id, organizationId);
    }
}
