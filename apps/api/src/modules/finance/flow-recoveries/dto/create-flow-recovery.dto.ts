
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateFlowRecoveryDto {
    @IsString()
    clientId: string;

    @IsString()
    periodo: string;

    @IsNumber()
    montoInicial: number;

    @IsNumber()
    recuperacionesReales: number;

    @IsNumber()
    porcentajeRecuperado: number;

    @IsString()
    @IsOptional()
    notas?: string;
}
