import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, IsDateString } from 'class-validator';

export class CreateFixedCostDto {
    @IsString()
    nombre: string;

    @IsString()
    categoria: string;

    @IsNumber()
    monto: number;

    @IsString()
    periodicidad: string;

    @IsInt()
    @IsOptional()
    diaVencimiento?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsDateString()
    @IsOptional()
    ultimoPago?: string;

    @IsDateString()
    @IsOptional()
    proximoPago?: string;

    @IsString()
    @IsOptional()
    notas?: string;
}
