import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto, organizationId: string) {
        // Validate that email is unique in the organization
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: createUserDto.email,
                organizationId,
                deletedAt: null,
            },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists in this organization');
        }

        // Validate that role belongs to the organization
        const role = await this.prisma.role.findFirst({
            where: {
                id: createUserDto.roleId,
                organizationId,
            },
        });

        if (!role) {
            throw new BadRequestException('Role not found or does not belong to this organization');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: createUserDto.email,
                password: hashedPassword,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                organizationId,
                roleId: createUserDto.roleId,
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async findAll(organizationId: string) {
        const users = await this.prisma.user.findMany({
            where: {
                organizationId,
                deletedAt: null,
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Remove passwords from response
        return users.map(({ password, ...user }) => user);
    }

    async findOne(id: string, organizationId: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async update(id: string, updateUserDto: UpdateUserDto, organizationId: string, currentUserId: string) {
        // Find user and verify it belongs to the organization
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent self-deactivation (users can't deactivate themselves)
        if (updateUserDto.isActive === false && id === currentUserId) {
            throw new ForbiddenException('You cannot deactivate your own account');
        }

        // If email is being updated, check uniqueness
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: updateUserDto.email,
                    organizationId,
                    deletedAt: null,
                    NOT: { id },
                },
            });

            if (existingUser) {
                throw new ConflictException('Email already exists in this organization');
            }
        }

        // If role is being updated, validate it belongs to organization
        if (updateUserDto.roleId && updateUserDto.roleId !== user.roleId) {
            const role = await this.prisma.role.findFirst({
                where: {
                    id: updateUserDto.roleId,
                    organizationId,
                },
            });

            if (!role) {
                throw new BadRequestException('Role not found or does not belong to this organization');
            }
        }

        // Hash password if provided
        const updateData: any = { ...updateUserDto };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        // Update user
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }

    async remove(id: string, organizationId: string, currentUserId: string) {
        // Find user and verify it belongs to the organization
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent self-deletion
        if (id === currentUserId) {
            throw new ForbiddenException('You cannot delete your own account');
        }

        // Soft delete: mark as inactive and set deletedAt
        const deletedUser = await this.prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = deletedUser;
        return userWithoutPassword;
    }
}
