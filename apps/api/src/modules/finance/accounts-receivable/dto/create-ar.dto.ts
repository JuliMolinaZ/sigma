import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreateAccountReceivableDto {
    @IsString()
    projectId: string;

    @IsString()
    @IsOptional()
    clientId?: string;

    @IsString()
    concepto: string;

    @IsNumber()
    monto: number;

    @IsDateString()
    @IsOptional()
    fechaVencimiento?: string;

    @IsNumber()
    @IsOptional()
    montoPagado?: number;

    @IsNumber()
    @IsOptional()
    montoRestante?: number;

    @IsEnum(PaymentStatus)
    @IsOptional()
    status?: PaymentStatus;

    @IsString()
    @IsOptional()
    notas?: string;
}
