import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateClientDto {
    @IsString()
    nombre: string;

    @IsString()
    @IsOptional()
    runCliente?: string;

    @IsString()
    @IsOptional()
    rfc?: string;

    @IsString()
    @IsOptional()
    direccion?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    contacto?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
