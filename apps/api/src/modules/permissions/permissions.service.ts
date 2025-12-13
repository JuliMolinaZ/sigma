import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreatePermissionDto) {
        // Verificar que no exista un permiso con el mismo resource y action
        const existing = await this.prisma.permission.findFirst({
            where: {
                resource: createDto.resource,
                action: createDto.action,
            },
        });

        if (existing) {
            throw new ConflictException(
                `Permission with resource "${createDto.resource}" and action "${createDto.action}" already exists`
            );
        }

        return this.prisma.permission.create({
            data: createDto,
        });
    }

    async findAll() {
        return this.prisma.permission.findMany({
            include: {
                _count: {
                    select: { roles: true },
                },
            },
            orderBy: [
                { resource: 'asc' },
                { action: 'asc' },
            ],
        });
    }

    async findByResource(resource: string) {
        return this.prisma.permission.findMany({
            where: { resource },
            include: {
                _count: {
                    select: { roles: true },
                },
            },
            orderBy: { action: 'asc' },
        });
    }

    async findOne(id: string) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
            include: {
                roles: {
                    include: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                organizationId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!permission) {
            throw new NotFoundException('Permission not found');
        }

        return permission;
    }

    async update(id: string, updateDto: UpdatePermissionDto) {
        const permission = await this.findOne(id);

        // Si se está cambiando resource o action, verificar que no exista otro con esos valores
        if (updateDto.resource || updateDto.action) {
            const newResource = updateDto.resource || permission.resource;
            const newAction = updateDto.action || permission.action;

            const existing = await this.prisma.permission.findFirst({
                where: {
                    resource: newResource,
                    action: newAction,
                },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException(
                    `Permission with resource "${newResource}" and action "${newAction}" already exists`
                );
            }
        }

        return this.prisma.permission.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        const permission = await this.findOne(id);

        // Verificar que no esté asignado a ningún rol
        const roleCount = await this.prisma.rolePermission.count({
            where: { permissionId: id },
        });

        if (roleCount > 0) {
            throw new ConflictException(
                `Cannot delete permission. It is assigned to ${roleCount} role(s). Please remove it from roles first.`
            );
        }

        return this.prisma.permission.delete({
            where: { id },
        });
    }

    async getResources() {
        try {
            // Get all permissions and extract unique resources
            // Note: Permission is a global model (not tenant-specific)
            const permissions = await this.prisma.permission.findMany({
                select: { resource: true },
            });

            // Extract unique resources and sort
            const uniqueResources = Array.from(
                new Set(permissions.map(p => p.resource))
            ).sort();

            console.log(`[PermissionsService] Found ${uniqueResources.length} unique resources`);
            return uniqueResources;
        } catch (error) {
            console.error('[PermissionsService] Error in getResources:', error);
            if (error instanceof Error) {
                console.error('[PermissionsService] Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                });
            }
            throw error;
        }
    }
}
