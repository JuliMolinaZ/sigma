import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createClientDto: CreateClientDto) {
        return this.prisma.client.create({
            data: {
                ...createClientDto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, query: QueryClientDto) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const { search, isActive } = query;
        const skip = (page - 1) * limit;

        console.log(`[ClientsService] findAll for Org: ${organizationId}, Page: ${page}, Limit: ${limit}`);

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

        const [clients, total] = await Promise.all([
            this.prisma.client.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    _count: {
                        select: {
                            projects: true,
                            invoices: true,
                        },
                    },
                },
            }),
            this.prisma.client.count({ where }),
        ]);

        return {
            data: clients,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, organizationId: string) {
        const client = await this.prisma.client.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                projects: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                invoices: {
                    take: 5,
                    orderBy: { issueDate: 'desc' },
                },
                _count: {
                    select: {
                        projects: true,
                        invoices: true,
                    },
                },
            },
        });

        if (!client) {
            throw new NotFoundException('Client not found');
        }

        return client;
    }

    async update(id: string, organizationId: string, updateClientDto: UpdateClientDto) {
        await this.findOne(id, organizationId);

        return this.prisma.client.update({
            where: { id },
            data: updateClientDto,
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        // Hard delete or Soft delete? Schema doesn't have deletedAt for Client, but has isActive.
        // Let's use isActive = false for "soft delete" behavior if we want to preserve history,
        // or actually delete if that's the requirement. 
        // Given enterprise nature, usually we don't delete clients with data.
        // But for now, let's assume standard delete or toggle active.
        // The prompt asked for "List view with filters... isActive".
        // Let's implement a delete that fails if there are relations, or just use isActive.
        // For now, I'll implement a delete that relies on Prisma's cascade or error if relations exist.
        // Actually, looking at schema: `organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)`
        // But Client -> Projects doesn't say Cascade.
        // Let's stick to standard delete.

        return this.prisma.client.delete({
            where: { id },
        });
    }

    async getStatistics(id: string, organizationId: string) {
        const client = await this.findOne(id, organizationId);

        const [totalInvoiced, totalPaid] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: { clientId: id, organizationId },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { clientId: id, organizationId, status: 'PAID' },
                _sum: { total: true },
            }),
        ]);

        return {
            totalInvoiced: totalInvoiced._sum.total || 0,
            totalPaid: totalPaid._sum.total || 0,
            outstandingBalance: (Number(totalInvoiced._sum.total || 0) - Number(totalPaid._sum.total || 0)),
        };
    }
}
