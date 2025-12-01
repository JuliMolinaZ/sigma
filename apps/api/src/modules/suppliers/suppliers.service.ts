import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';

@Injectable()
export class SuppliersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createSupplierDto: CreateSupplierDto) {
        return this.prisma.supplier.create({
            data: {
                ...createSupplierDto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, query: QuerySupplierDto) {
        const { search, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            organizationId,
        };

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { rfc: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { contacto: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [suppliers, total] = await Promise.all([
            this.prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    _count: {
                        select: {
                            accountsPayable: true,
                            requisitions: true,
                        },
                    },
                },
            }),
            this.prisma.supplier.count({ where }),
        ]);

        return {
            data: suppliers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, organizationId: string) {
        const supplier = await this.prisma.supplier.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                accountsPayable: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                requisitions: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        accountsPayable: true,
                        requisitions: true,
                    },
                },
            },
        });

        if (!supplier) {
            throw new NotFoundException('Supplier not found');
        }

        return supplier;
    }

    async update(id: string, organizationId: string, updateSupplierDto: UpdateSupplierDto) {
        await this.findOne(id, organizationId);

        return this.prisma.supplier.update({
            where: { id },
            data: updateSupplierDto,
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.supplier.delete({
            where: { id },
        });
    }
}
