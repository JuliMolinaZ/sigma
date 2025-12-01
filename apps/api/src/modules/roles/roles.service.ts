import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

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
        });
    }

    findAll() {
        return this.prisma.role.findMany({
            include: { _count: { select: { users: true } } },
        });
    }

    async findOne(id: string) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: { permissions: { include: { permission: true } } },
        });
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async update(id: string, updateRoleDto: UpdateRoleDto) {
        return this.prisma.role.update({
            where: { id },
            data: updateRoleDto,
        });
    }

    async remove(id: string) {
        const role = await this.findOne(id);
        if (role.isSystem) {
            throw new ConflictException('Cannot delete system role');
        }
        return this.prisma.role.delete({
            where: { id },
        });
    }
}
