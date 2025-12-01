import { IsString, IsNumber, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreatePaymentComplementDto {
    @IsUUID()
    @IsOptional()
    accountReceivableId?: string;

    @IsUUID()
    @IsOptional()
    accountPayableId?: string;

    @IsNumber()
    monto: number;

    @IsDateString()
    fechaPago: string;

    @IsString()
    @IsOptional()
    formaPago?: string;

    @IsString()
    @IsOptional()
    referencia?: string;

    @IsString()
    @IsOptional()
    notas?: string;

    @IsString()
    @IsOptional()
    cfdiUuid?: string;

    @IsString()
    @IsOptional()
    cfdiUrl?: string;
}
