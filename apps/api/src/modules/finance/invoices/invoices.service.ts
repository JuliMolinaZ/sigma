import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@Injectable()
export class InvoicesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createDto: CreateInvoiceDto) {
        return this.prisma.invoice.create({
            data: {
                ...createDto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, query: QueryInvoiceDto) {
        const { search, status, clientId, startDate, endDate, page = 1, limit = 20 } = query;
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

        if (startDate || endDate) {
            where.issueDate = {};
            if (startDate) where.issueDate.gte = new Date(startDate);
            if (endDate) where.issueDate.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { number: { contains: search, mode: 'insensitive' } },
                { cfdiUuid: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    issueDate: 'desc',
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            nombre: true,
                            rfc: true,
                        },
                    },
                },
            }),
            this.prisma.invoice.count({ where }),
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
        const item = await this.prisma.invoice.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                client: true,
            },
        });

        if (!item) {
            throw new NotFoundException('Invoice not found');
        }

        return item;
    }

    async update(id: string, organizationId: string, updateDto: UpdateInvoiceDto) {
        await this.findOne(id, organizationId);

        return this.prisma.invoice.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.invoice.delete({
            where: { id },
        });
    }

    async getStatistics(organizationId: string) {
        const [totalInvoiced, totalPaid, totalOverdue] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: { organizationId },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { organizationId, status: 'PAID' },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { organizationId, status: 'OVERDUE' },
                _sum: { total: true },
            }),
        ]);

        return {
            totalInvoiced: totalInvoiced._sum.total || 0,
            totalPaid: totalPaid._sum.total || 0,
            totalOverdue: totalOverdue._sum.total || 0,
        };
    }
}
