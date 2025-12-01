
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateFlowRecoveryDto } from './dto/create-flow-recovery.dto';
import { UpdateFlowRecoveryDto } from './dto/update-flow-recovery.dto';

@Injectable()
export class FlowRecoveriesService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, data: CreateFlowRecoveryDto) {
        return this.prisma.flowRecovery.create({
            data: {
                ...data,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.flowRecovery.findMany({
            where: { organizationId },
            include: {
                client: true,
            },
        });
    }

    async findOne(id: string, organizationId: string) {
        return this.prisma.flowRecovery.findFirst({
            where: { id, organizationId },
            include: {
                client: true,
            },
        });
    }

    async update(id: string, organizationId: string, data: UpdateFlowRecoveryDto) {
        return this.prisma.flowRecovery.update({
            where: { id, organizationId },
            data,
        });
    }

    async remove(id: string, organizationId: string) {
        return this.prisma.flowRecovery.delete({
            where: { id, organizationId },
        });
    }
}
