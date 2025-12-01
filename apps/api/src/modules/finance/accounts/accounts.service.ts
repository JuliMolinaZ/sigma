import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(organizationId: string, createAccountDto: CreateAccountDto) {
        // Check if code already exists
        const existing = await this.prisma.account.findFirst({
            where: {
                code: createAccountDto.code,
                organizationId,
            },
        });

        if (existing) {
            throw new ConflictException('Account code already exists');
        }

        return this.prisma.account.create({
            data: {
                ...createAccountDto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string, type?: AccountType) {
        const where: any = {
            organizationId,
        };

        if (type) {
            where.type = type;
        }

        return this.prisma.account.findMany({
            where,
            orderBy: [{ type: 'asc' }, { code: 'asc' }],
            include: {
                _count: {
                    select: {
                        debitEntries: true,
                        creditEntries: true,
                    },
                },
            },
        });
    }

    async findOne(id: string, organizationId: string) {
        const account = await this.prisma.account.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                debitEntries: {
                    include: {
                        journalEntry: true,
                    },
                    orderBy: {
                        journalEntry: {
                            date: 'desc',
                        },
                    },
                    take: 10,
                },
                creditEntries: {
                    include: {
                        journalEntry: true,
                    },
                    orderBy: {
                        journalEntry: {
                            date: 'desc',
                        },
                    },
                    take: 10,
                },
            },
        });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        return account;
    }

    async update(id: string, organizationId: string, updateAccountDto: UpdateAccountDto) {
        await this.findOne(id, organizationId);

        if (updateAccountDto.code) {
            const existing = await this.prisma.account.findFirst({
                where: {
                    code: updateAccountDto.code,
                    organizationId,
                    id: { not: id },
                },
            });

            if (existing) {
                throw new ConflictException('Account code already exists');
            }
        }

        return this.prisma.account.update({
            where: { id },
            data: updateAccountDto,
        });
    }

    async remove(id: string, organizationId: string) {
        const account = await this.findOne(id, organizationId);

        // Check if account has transactions
        const hasTransactions =
            (await this.prisma.journalLine.count({
                where: {
                    OR: [{ debitAccountId: id }, { creditAccountId: id }],
                },
            })) > 0;

        if (hasTransactions) {
            throw new ConflictException('Cannot delete account with existing transactions');
        }

        return this.prisma.account.delete({
            where: { id },
        });
    }

    async getBalance(id: string, organizationId: string) {
        const account = await this.findOne(id, organizationId);

        const [debits, credits] = await Promise.all([
            this.prisma.journalLine.aggregate({
                where: { debitAccountId: id },
                _sum: { amount: true },
            }),
            this.prisma.journalLine.aggregate({
                where: { creditAccountId: id },
                _sum: { amount: true },
            }),
        ]);

        const debitTotal = debits._sum.amount || 0;
        const creditTotal = credits._sum.amount || 0;

        // Balance calculation based on account type
        let balance = 0;
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
            balance = Number(debitTotal) - Number(creditTotal);
        } else {
            balance = Number(creditTotal) - Number(debitTotal);
        }

        return {
            accountId: id,
            accountName: account.name,
            accountType: account.type,
            balance,
            debitTotal: Number(debitTotal),
            creditTotal: Number(creditTotal),
        };
    }
}
