import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SessionService {
    constructor(private readonly prisma: PrismaService) { }

    async createSession(userId: string, refreshToken: string, userAgent?: string, ipAddress?: string) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return this.prisma.session.create({
            data: {
                userId,
                refreshToken, // Can be placeholder initially
                userAgent,
                ipAddress,
                expiresAt,
            },
        });
    }

    async updateSessionToken(sessionId: string, hashedRefreshToken: string) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data: { refreshToken: hashedRefreshToken },
        });
    }

    async findSessionById(sessionId: string) {
        return this.prisma.session.findUnique({
            where: { id: sessionId },
        });
    }

    async revokeSession(sessionId: string) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data: { isValid: false },
        });
    }

    async revokeAllUserSessions(userId: string) {
        return this.prisma.session.updateMany({
            where: { userId, isValid: true },
            data: { isValid: false },
        });
    }
}
