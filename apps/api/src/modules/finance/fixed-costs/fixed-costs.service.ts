import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { UpdateFixedCostDto } from './dto/update-fixed-cost.dto';
import { QueryFixedCostDto } from './dto/query-fixed-cost.dto';

@Injectable()
export class FixedCostsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createDto: CreateFixedCostDto) {
        return this.prisma.fixedCost.create({
            data: {
                ...createDto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, query: QueryFixedCostDto) {
        const { search, categoria, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            organizationId,
        };

        if (categoria) {
            where.categoria = categoria;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { notas: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.fixedCost.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.fixedCost.count({ where }),
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
        const item = await this.prisma.fixedCost.findFirst({
            where: {
                id,
                organizationId,
            },
        });

        if (!item) {
            throw new NotFoundException('Fixed Cost not found');
        }

        return item;
    }

    async update(id: string, organizationId: string, updateDto: UpdateFixedCostDto) {
        await this.findOne(id, organizationId);

        return this.prisma.fixedCost.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.fixedCost.delete({
            where: { id },
        });
    }

    async getStatistics(organizationId: string) {
        const totalMonthly = await this.prisma.fixedCost.aggregate({
            where: {
                organizationId,
                isActive: true,
                periodicidad: 'Mensual',
            },
            _sum: { monto: true },
        });

        return {
            totalMonthly: totalMonthly._sum.monto || 0,
        };
    }
}
