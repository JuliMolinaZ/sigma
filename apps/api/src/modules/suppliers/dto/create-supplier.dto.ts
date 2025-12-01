import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
    @IsString()
    nombre: string;

    @IsString()
    @IsOptional()
    runProveedor?: string;

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

    @IsString()
    @IsOptional()
    datosBancarios?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
