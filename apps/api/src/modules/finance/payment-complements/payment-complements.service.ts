import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePaymentComplementDto } from './dto/create-payment-complement.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentComplementsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(organizationId: string, createDto: CreatePaymentComplementDto) {
        const { accountReceivableId, accountPayableId, monto } = createDto;

        if (!accountReceivableId && !accountPayableId) {
            throw new BadRequestException('Must provide either accountReceivableId or accountPayableId');
        }

        if (accountReceivableId) {
            // 1. Verify AR exists and belongs to organization
            const ar = await this.prisma.accountReceivable.findFirst({
                where: { id: accountReceivableId, organizationId },
            });

            if (!ar) {
                throw new NotFoundException('Account Receivable not found');
            }

            // 2. Validate amount
            if (monto <= 0) {
                throw new BadRequestException('Payment amount must be greater than 0');
            }

            // 3. Create Payment Complement
            const payment = await this.prisma.paymentComplement.create({
                data: {
                    ...createDto,
                    organizationId,
                },
            });

            // 4. Update Account Receivable totals and status
            const newPaid = Number(ar.montoPagado) + Number(monto);
            const newRemaining = Number(ar.monto) - newPaid;

            // Determine status
            let newStatus: PaymentStatus = 'PARTIAL';
            if (newRemaining <= 0.01) { // Epsilon for float precision
                newStatus = 'PAID';
            }

            await this.prisma.accountReceivable.update({
                where: { id: accountReceivableId },
                data: {
                    montoPagado: newPaid,
                    montoRestante: newRemaining,
                    status: newStatus,
                },
            });

            return payment;
        } else if (accountPayableId) {
            // 1. Verify AP exists and belongs to organization
            const ap = await this.prisma.accountPayable.findFirst({
                where: { id: accountPayableId, organizationId },
            });

            if (!ap) {
                throw new NotFoundException('Account Payable not found');
            }

            // 2. Validate amount
            if (monto <= 0) {
                throw new BadRequestException('Payment amount must be greater than 0');
            }

            // 3. Create Payment Complement
            const payment = await this.prisma.paymentComplement.create({
                data: {
                    ...createDto,
                    organizationId,
                },
            });

            // 4. Update Account Payable totals and status
            const newPaid = Number(ap.montoPagado) + Number(monto);
            const newRemaining = Number(ap.monto) - newPaid;

            // Determine status
            let newStatus: PaymentStatus = 'PARTIAL';
            if (newRemaining <= 0.01) { // Epsilon for float precision
                newStatus = 'PAID';
            }

            await this.prisma.accountPayable.update({
                where: { id: accountPayableId },
                data: {
                    montoPagado: newPaid,
                    montoRestante: newRemaining,
                    status: newStatus,
                },
            });

            return payment;
        }
    }

    async findAllByAr(organizationId: string, arId: string) {
        return this.prisma.paymentComplement.findMany({
            where: {
                organizationId,
                accountReceivableId: arId,
            },
            include: {
                accountReceivable: {
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
                    },
                },
            },
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async findAllByAp(organizationId: string, apId: string) {
        return this.prisma.paymentComplement.findMany({
            where: {
                organizationId,
                accountPayableId: apId,
            },
            include: {
                accountPayable: {
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.paymentComplement.findMany({
            where: {
                organizationId,
            },
            include: {
                accountReceivable: {
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
                    },
                },
                accountPayable: {
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async findAllByClient(organizationId: string, clientId: string) {
        return this.prisma.paymentComplement.findMany({
            where: {
                organizationId,
                accountReceivable: {
                    clientId: clientId,
                },
            },
            include: {
                accountReceivable: {
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
                    },
                },
            },
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async findAllBySupplier(organizationId: string, supplierId: string) {
        return this.prisma.paymentComplement.findMany({
            where: {
                organizationId,
                accountPayable: {
                    supplierId: supplierId,
                },
            },
            include: {
                accountPayable: {
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }
}
