import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';

@Injectable()
export class JournalEntriesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(organizationId: string, createJournalEntryDto: CreateJournalEntryDto) {
        const { lines, ...entryData } = createJournalEntryDto;

        if (!lines || lines.length === 0) {
            throw new BadRequestException('Journal entry must have at least one line');
        }

        // Validate all accounts exist and belong to organization
        const accountIds = new Set<string>();
        lines.forEach((line) => {
            accountIds.add(line.debitAccountId);
            accountIds.add(line.creditAccountId);
        });

        const accounts = await this.prisma.account.findMany({
            where: {
                id: { in: Array.from(accountIds) },
                organizationId,
            },
        });

        if (accounts.length !== accountIds.size) {
            throw new BadRequestException('One or more accounts not found');
        }

        // Create journal entry with lines in a transaction
        return this.prisma.$transaction(async (prisma) => {
            const entry = await prisma.journalEntry.create({
                data: {
                    ...entryData,
                    organizationId,
                },
            });

            // Create journal lines
            const journalLines = await Promise.all(
                lines.map((line) =>
                    prisma.journalLine.create({
                        data: {
                            journalEntryId: entry.id,
                            debitAccountId: line.debitAccountId,
                            creditAccountId: line.creditAccountId,
                            amount: line.amount,
                        },
                    }),
                ),
            );

            // Update account balances
            for (const line of lines) {
                await prisma.account.update({
                    where: { id: line.debitAccountId },
                    data: {
                        balance: { increment: line.amount },
                    },
                });

                await prisma.account.update({
                    where: { id: line.creditAccountId },
                    data: {
                        balance: { decrement: line.amount },
                    },
                });
            }

            return prisma.journalEntry.findUnique({
                where: { id: entry.id },
                include: {
                    lines: {
                        include: {
                            debitAccount: true,
                            creditAccount: true,
                        },
                    },
                },
            });
        });
    }

    async findAll(organizationId: string, startDate?: string, endDate?: string) {
        const where: any = {
            organizationId,
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        return this.prisma.journalEntry.findMany({
            where,
            include: {
                lines: {
                    include: {
                        debitAccount: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        creditAccount: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    async findOne(id: string, organizationId: string) {
        const entry = await this.prisma.journalEntry.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                lines: {
                    include: {
                        debitAccount: true,
                        creditAccount: true,
                    },
                },
            },
        });

        if (!entry) {
            throw new NotFoundException('Journal entry not found');
        }

        return entry;
    }

    async update(id: string, organizationId: string, updateJournalEntryDto: UpdateJournalEntryDto) {
        const entry = await this.findOne(id, organizationId);

        if (entry.isLocked) {
            throw new ConflictException('Cannot update a locked journal entry');
        }

        return this.prisma.journalEntry.update({
            where: { id },
            data: updateJournalEntryDto,
            include: {
                lines: {
                    include: {
                        debitAccount: true,
                        creditAccount: true,
                    },
                },
            },
        });
    }

    async lock(id: string, organizationId: string) {
        await this.findOne(id, organizationId);

        return this.prisma.journalEntry.update({
            where: { id },
            data: {
                isLocked: true,
            },
        });
    }

    async remove(id: string, organizationId: string) {
        const entry = await this.findOne(id, organizationId);

        if (entry.isLocked) {
            throw new ConflictException('Cannot delete a locked journal entry');
        }

        // Reverse account balances and delete entry
        return this.prisma.$transaction(async (prisma) => {
            // Reverse balances
            for (const line of entry.lines) {
                await prisma.account.update({
                    where: { id: line.debitAccountId },
                    data: {
                        balance: { decrement: line.amount },
                    },
                });

                await prisma.account.update({
                    where: { id: line.creditAccountId },
                    data: {
                        balance: { increment: line.amount },
                    },
                });
            }

            // Delete journal entry (cascade will delete lines)
            await prisma.journalEntry.delete({
                where: { id },
            });
        });
    }

    async validateBalance(createJournalEntryDto: CreateJournalEntryDto): Promise<boolean> {
        const { lines } = createJournalEntryDto;

        const totalDebits = lines.reduce((sum, line) => sum + line.amount, 0);
        const totalCredits = lines.reduce((sum, line) => sum + line.amount, 0);

        return totalDebits === totalCredits;
    }
}
