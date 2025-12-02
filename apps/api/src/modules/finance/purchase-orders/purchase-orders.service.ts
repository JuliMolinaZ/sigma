import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { PurchaseOrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument = require('pdfkit');

@Injectable()
export class PurchaseOrdersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calculate subtotal, VAT, and total from amount
     */
    private calculateAmounts(amount: number, includesVAT: boolean) {
        const VAT_RATE = 0.16;
        let subtotal: Decimal;
        let vat: Decimal;
        let total: Decimal;

        if (includesVAT) {
            // Amount includes VAT, we need to extract it
            total = new Decimal(amount);
            subtotal = total.div(new Decimal(1).add(VAT_RATE));
            vat = total.minus(subtotal);
        } else {
            // Amount does NOT include VAT - no VAT should be added
            subtotal = new Decimal(amount);
            vat = new Decimal(0);
            total = subtotal;
        }

        return {
            subtotal,
            vat,
            total,
        };
    }

    async create(organizationId: string, userId: string, createDto: CreatePurchaseOrderDto) {
        // Check if folio already exists
        const existingPO = await this.prisma.purchaseOrder.findUnique({
            where: { folio: createDto.folio },
        });

        if (existingPO) {
            throw new BadRequestException('Folio already exists');
        }

        // Calculate amounts
        const { subtotal, vat, total } = this.calculateAmounts(
            createDto.amount,
            createDto.includesVAT ?? false
        );

        return this.prisma.purchaseOrder.create({
            data: {
                folio: createDto.folio,
                description: createDto.description,
                amount: createDto.amount,
                includesVAT: createDto.includesVAT ?? false,
                subtotal,
                vat,
                total,
                comments: createDto.comments,
                supplierId: createDto.supplierId,
                projectId: createDto.projectId,
                minPaymentDate: new Date(createDto.minPaymentDate),
                maxPaymentDate: new Date(createDto.maxPaymentDate),
                status: createDto.status ?? PurchaseOrderStatus.DRAFT,
                createdById: userId,
                organizationId,
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        nombre: true,
                        rfc: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findAll(organizationId: string, query: QueryPurchaseOrderDto) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const { search, status, supplierId, projectId } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (projectId) {
            where.projectId = projectId;
        }

        if (search) {
            where.OR = [
                { folio: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { comments: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
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
                    project: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    authorizedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            this.prisma.purchaseOrder.count({ where }),
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
        const item = await this.prisma.purchaseOrder.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                supplier: true,
                project: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!item) {
            throw new NotFoundException('Purchase Order not found');
        }

        return item;
    }

    async update(id: string, organizationId: string, updateDto: UpdatePurchaseOrderDto) {
        await this.findOne(id, organizationId);

        // If amount or includesVAT is being updated, recalculate amounts
        let calculatedAmounts: any = {};
        if (updateDto.amount !== undefined || updateDto.includesVAT !== undefined) {
            const currentPO = await this.prisma.purchaseOrder.findUnique({
                where: { id },
            });

            const amount = updateDto.amount ?? Number(currentPO.amount);
            const includesVAT = updateDto.includesVAT ?? currentPO.includesVAT;

            calculatedAmounts = this.calculateAmounts(amount, includesVAT);
        }

        // Convert date strings to Date objects
        const updateData: any = { ...updateDto };
        if (updateDto.minPaymentDate) {
            updateData.minPaymentDate = new Date(updateDto.minPaymentDate);
        }
        if (updateDto.maxPaymentDate) {
            updateData.maxPaymentDate = new Date(updateDto.maxPaymentDate);
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                ...updateData,
                ...calculatedAmounts,
            },
            include: {
                supplier: {
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
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async remove(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.purchaseOrder.delete({
            where: { id },
        });
    }

    /**
     * Approve a purchase order
     */
    async approve(id: string, organizationId: string, userId: string) {
        const po = await this.findOne(id, organizationId);

        if (po.status !== PurchaseOrderStatus.PENDING) {
            throw new BadRequestException('Can only approve purchase orders with PENDING status');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: PurchaseOrderStatus.APPROVED,
                authorizedById: userId,
                authorizedAt: new Date(),
            },
            include: {
                supplier: true,
                project: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Reject a purchase order
     */
    async reject(id: string, organizationId: string, userId: string) {
        const po = await this.findOne(id, organizationId);

        if (po.status !== PurchaseOrderStatus.PENDING) {
            throw new BadRequestException('Can only reject purchase orders with PENDING status');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: PurchaseOrderStatus.REJECTED,
                authorizedById: userId,
                authorizedAt: new Date(),
            },
            include: {
                supplier: true,
                project: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Mark a purchase order as paid
     */
    async markAsPaid(id: string, organizationId: string) {
        const po = await this.findOne(id, organizationId);

        if (po.status !== PurchaseOrderStatus.APPROVED) {
            throw new BadRequestException('Can only mark approved purchase orders as paid');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: PurchaseOrderStatus.PAID,
            },
            include: {
                supplier: true,
                project: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Submit for approval (DRAFT → PENDING)
     */
    async submitForApproval(id: string, organizationId: string) {
        const po = await this.findOne(id, organizationId);

        if (po.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Can only submit draft purchase orders for approval');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: PurchaseOrderStatus.PENDING,
            },
            include: {
                supplier: true,
                project: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                authorizedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Get statistics
     */
    async getStatistics(organizationId: string) {
        const [totalByStatus, totalAmount] = await Promise.all([
            this.prisma.purchaseOrder.groupBy({
                by: ['status'],
                where: { organizationId },
                _count: true,
                _sum: { total: true },
            }),
            this.prisma.purchaseOrder.aggregate({
                where: { organizationId },
                _sum: { total: true },
            }),
        ]);

        const stats = {
            draft: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            paid: 0,
            totalAmount: totalAmount._sum.total || 0,
            draftAmount: 0,
            pendingAmount: 0,
            approvedAmount: 0,
            paidAmount: 0,
        };

        totalByStatus.forEach((item) => {
            const status = item.status.toLowerCase();
            stats[`${status}`] = item._count;
            stats[`${status}Amount`] = Number(item._sum.total || 0);
        });

        return stats;
    }

    /**
     * Generate PDF for a purchase order
     */
    async generatePdf(id: string, organizationId: string): Promise<Buffer> {
        const po = await this.findOne(id, organizationId);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Header
                doc.fontSize(20).text('ORDEN DE COMPRA', { align: 'center' });
                doc.moveDown();

                // Folio and Status
                doc.fontSize(12);
                doc.text(`Folio: ${po.folio}`, { continued: true });
                doc.text(`     Estado: ${this.getStatusLabel(po.status)}`, { align: 'right' });
                doc.moveDown();

                // Dates
                if (po.createdAt) {
                    doc.fontSize(10).text(`Fecha de Creación: ${new Date(po.createdAt).toLocaleDateString('es-MX')}`);
                }
                if (po.authorizedAt) {
                    doc.text(`Fecha de Autorización: ${new Date(po.authorizedAt).toLocaleDateString('es-MX')}`);
                }
                doc.moveDown();

                // Supplier Information
                if (po.supplier) {
                    doc.fontSize(12).text('PROVEEDOR', { underline: true });
                    doc.fontSize(10);
                    doc.text(`Nombre: ${po.supplier.nombre}`);
                    if (po.supplier.rfc) {
                        doc.text(`RFC: ${po.supplier.rfc}`);
                    }
                    doc.moveDown();
                }

                // Project Information
                if (po.project) {
                    doc.fontSize(12).text('PROYECTO', { underline: true });
                    doc.fontSize(10);
                    doc.text(`Nombre: ${po.project.name}`);
                    doc.moveDown();
                }

                // Description
                doc.fontSize(12).text('DESCRIPCIÓN', { underline: true });
                doc.fontSize(10);
                doc.text(po.description, { align: 'justify' });
                doc.moveDown();

                // Amounts Table
                doc.fontSize(12).text('DESGLOSE DE MONTOS', { underline: true });
                doc.moveDown(0.5);

                const startY = doc.y;
                const tableTop = startY;
                const itemHeight = 25;

                // Table Headers
                doc.fontSize(10);
                doc.text('Concepto', 50, tableTop, { width: 250 });
                doc.text('Monto', 350, tableTop, { width: 150, align: 'right' });

                // Horizontal line after headers
                doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

                // Subtotal
                let currentY = tableTop + itemHeight;
                doc.text('Subtotal', 50, currentY, { width: 250 });
                doc.text(`$${Number(po.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 350, currentY, { width: 150, align: 'right' });

                // VAT
                currentY += itemHeight;
                doc.text('IVA (16%)', 50, currentY, { width: 250 });
                doc.text(`$${Number(po.vat).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 350, currentY, { width: 150, align: 'right' });

                // Horizontal line before total
                currentY += 20;
                doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

                // Total
                currentY += 10;
                doc.fontSize(12).font('Helvetica-Bold');
                doc.text('TOTAL', 50, currentY, { width: 250 });
                doc.text(`$${Number(po.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 350, currentY, { width: 150, align: 'right' });
                doc.font('Helvetica');

                doc.moveDown(3);

                // Payment Dates
                if (po.minPaymentDate || po.maxPaymentDate) {
                    doc.fontSize(12).text('FECHAS DE PAGO', { underline: true });
                    doc.fontSize(10);
                    if (po.minPaymentDate) {
                        doc.text(`Fecha Mínima: ${new Date(po.minPaymentDate).toLocaleDateString('es-MX')}`);
                    }
                    if (po.maxPaymentDate) {
                        doc.text(`Fecha Máxima: ${new Date(po.maxPaymentDate).toLocaleDateString('es-MX')}`);
                    }
                    doc.moveDown();
                }

                // Comments
                if (po.comments) {
                    doc.fontSize(12).text('COMENTARIOS', { underline: true });
                    doc.fontSize(10);
                    doc.text(po.comments, { align: 'justify' });
                    doc.moveDown();
                }

                // Created By
                if (po.createdBy) {
                    doc.fontSize(10);
                    doc.text(`Creado por: ${po.createdBy.firstName} ${po.createdBy.lastName}`, { align: 'left' });
                }

                // Authorized By
                if (po.authorizedBy) {
                    doc.text(`Autorizado por: ${po.authorizedBy.firstName} ${po.authorizedBy.lastName}`, { align: 'left' });
                }

                // Footer
                doc.fontSize(8).text(
                    `Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get human-readable status label
     */
    private getStatusLabel(status: PurchaseOrderStatus): string {
        const labels = {
            [PurchaseOrderStatus.DRAFT]: 'Borrador',
            [PurchaseOrderStatus.PENDING]: 'Pendiente de Aprobación',
            [PurchaseOrderStatus.APPROVED]: 'Aprobada',
            [PurchaseOrderStatus.REJECTED]: 'Rechazada',
            [PurchaseOrderStatus.PAID]: 'Pagada',
        };
        return labels[status] || status;
    }
}
