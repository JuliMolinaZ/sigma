import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAccountPayableDto } from './dto/create-ap.dto';
import { UpdateAccountPayableDto } from './dto/update-ap.dto';
import { QueryAccountPayableDto } from './dto/query-ap.dto';

@Injectable()
export class AccountsPayableService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createDto: CreateAccountPayableDto) {
        return this.prisma.accountPayable.create({
            data: {
                ...createDto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, query: QueryAccountPayableDto) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const { search, status, supplierId, categoryId, pagado } = query;
        const skip = (page - 1) * limit;

        console.log(`[APService] findAll for Org: ${organizationId}, Page: ${page}, Limit: ${limit}`);

        const where: any = {
            organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (pagado !== undefined) {
            where.pagado = pagado;
        }

        if (search) {
            where.OR = [
                { concepto: { contains: search, mode: 'insensitive' } },
                { notas: { contains: search, mode: 'insensitive' } },
                { referenciaPago: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.accountPayable.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            nombre: true,
                            color: true,
                        },
                    },
                    paymentComplements: {
                        orderBy: { fechaPago: 'desc' },
                        take: 5, // Mostrar los últimos 5 pagos
                    },
                },
            }),
            this.prisma.accountPayable.count({ where }),
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
        const item = await this.prisma.accountPayable.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                supplier: true,
                category: true,
                paymentComplements: {
                    orderBy: { fechaPago: 'desc' },
                },
            },
        });

        if (!item) {
            throw new NotFoundException('Account Payable not found');
        }

        return item;
    }

    async update(id: string, organizationId: string, updateDto: UpdateAccountPayableDto) {
        await this.findOne(id, organizationId);

        return this.prisma.accountPayable.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.accountPayable.delete({
            where: { id },
        });
    }

    async getStatistics(organizationId: string) {
        const [totalPending, totalPaid] = await Promise.all([
            this.prisma.accountPayable.aggregate({
                where: { organizationId, pagado: false },
                _sum: { monto: true },
            }),
            this.prisma.accountPayable.aggregate({
                where: { organizationId, pagado: true },
                _sum: { monto: true },
            }),
        ]);

        return {
            totalPending: totalPending._sum.monto || 0,
            totalPaid: totalPaid._sum.monto || 0,
        };
    }
}
