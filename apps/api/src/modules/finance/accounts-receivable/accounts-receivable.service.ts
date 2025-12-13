import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAccountReceivableDto } from './dto/create-ar.dto';
import { UpdateAccountReceivableDto } from './dto/update-ar.dto';
import { QueryAccountReceivableDto } from './dto/query-ar.dto';

@Injectable()
export class AccountsReceivableService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createDto: CreateAccountReceivableDto) {
        return this.prisma.accountReceivable.create({
            data: {
                ...createDto,
                montoRestante: createDto.monto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, query: QueryAccountReceivableDto) {
        const { search, status, clientId, projectId, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (clientId) {
            where.clientId = clientId;
        }

        if (projectId) {
            where.projectId = projectId;
        }

        if (search) {
            where.OR = [
                { concepto: { contains: search, mode: 'insensitive' } },
                { notas: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.accountReceivable.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    paymentComplements: {
                        orderBy: { fechaPago: 'desc' },
                        take: 5, // Mostrar los últimos 5 pagos
                    },
                },
            }),
            this.prisma.accountReceivable.count({ where }),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, organizationId: string) {
        const item = await this.prisma.accountReceivable.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                client: true,
                project: true,
                paymentComplements: {
                    orderBy: { fechaPago: 'desc' },
                },
            },
        });

        if (!item) {
            throw new NotFoundException('Account Receivable not found');
        }

        return item;
    }

    async update(id: string, organizationId: string, updateDto: UpdateAccountReceivableDto) {
        await this.findOne(id, organizationId);

        // If amount changes, we need to recalculate remaining amount?
        // For now, let's assume simple update. Complex logic for payments should be in PaymentComplement service.

        return this.prisma.accountReceivable.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.accountReceivable.delete({
            where: { id },
        });
    }

    async getStatistics(organizationId: string) {
        const [totalPending, totalOverdue] = await Promise.all([
            this.prisma.accountReceivable.aggregate({
                where: { organizationId, status: 'PENDING' },
                _sum: { montoRestante: true },
            }),
            this.prisma.accountReceivable.aggregate({
                where: { organizationId, status: 'OVERDUE' },
                _sum: { montoRestante: true },
            }),
        ]);

        return {
            totalPending: totalPending._sum.montoRestante || 0,
            totalOverdue: totalOverdue._sum.montoRestante || 0,
        };
    }
}
