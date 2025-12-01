import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @Get()
    check() {
        return { status: 'ok' };
    }

    @Get('live')
    live() {
        return { status: 'ok', uptime: process.uptime() };
    }

    @Get('ready')
    async ready() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'ok', database: 'connected' };
        } catch (e) {
            const error = e as Error;
            return { status: 'error', database: 'disconnected', error: error.message };
        }
    }
}
