import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findUserByEmail(email: string) {
        // Use findFirst since email is part of composite unique key (email_organizationId)
        // During login, we don't know organizationId yet
        return this.prisma.user.findFirst({
            where: { email },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
    }

    async findUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
    }

    async updateUserPassword(userId: string, password: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { password },
        });
    }

    async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
        // Invalidate existing tokens
        await this.prisma.passwordResetToken.deleteMany({ where: { userId } });

        return this.prisma.passwordResetToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    async findPasswordResetToken(token: string) {
        return this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }

    async findPasswordResetTokensByUserId(userId: string) {
        return this.prisma.passwordResetToken.findMany({
            where: { userId },
        });
    }

    async markPasswordResetTokenAsUsed(id: string) {
        return this.prisma.passwordResetToken.update({
            where: { id },
            data: { used: true },
        });
    }

    async deletePasswordResetToken(id: string) {
        return this.prisma.passwordResetToken.delete({
            where: { id },
        });
    }

    async createOrganizationWithAdmin(dto: RegisterDto & { password: string; organizationName: string }) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Organization
            const org = await tx.organization.create({
                data: {
                    name: dto.organizationName,
                    slug: `${dto.organizationName.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
                },
            });

            // 2. Create Admin Role for this Org
            const adminRole = await tx.role.create({
                data: {
                    name: 'ADMIN',
                    description: 'Organization Administrator',
                    isSystem: true,
                    organizationId: org.id,
                },
            });

            // 3. Create User
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    password: dto.password,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    organizationId: org.id,
                    roleId: adminRole.id,
                },
                include: { role: true },
            });

            return { user, organization: org };
        });
    }

    async createUser(dto: RegisterDto, hashedPassword: string, roleId: string) {
        // Deprecated or needs update for invites
        throw new Error('Use createOrganizationWithAdmin or inviteUser');
    }

    async findRoleByName(name: string, organizationId: string) {
        return this.prisma.role.findUnique({
            where: { name_organizationId: { name, organizationId } },
        });
    }
}
