import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreateAccountPayableDto {
    @IsString()
    @IsOptional()
    supplierId?: string;

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsString()
    concepto: string;

    @IsNumber()
    monto: number;

    @IsDateString()
    @IsOptional()
    fechaVencimiento?: string;

    @IsEnum(PaymentStatus)
    @IsOptional()
    status?: PaymentStatus;

    @IsBoolean()
    @IsOptional()
    pagado?: boolean;

    @IsDateString()
    @IsOptional()
    fechaPago?: string;

    @IsString()
    @IsOptional()
    formaPago?: string;

    @IsString()
    @IsOptional()
    referenciaPago?: string;

    @IsString()
    @IsOptional()
    facturaUrl?: string;

    @IsString()
    @IsOptional()
    comprobanteUrl?: string;

    @IsString()
    @IsOptional()
    notas?: string;
}
