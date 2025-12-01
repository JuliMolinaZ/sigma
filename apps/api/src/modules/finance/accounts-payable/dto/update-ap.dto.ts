import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountPayableDto } from './create-ap.dto';

import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateAccountPayableDto extends PartialType(CreateAccountPayableDto) {
    @IsBoolean()
    @IsOptional()
    autorizado?: boolean;

    @IsNumber()
    @IsOptional()
    montoPagado?: number;

    @IsNumber()
    @IsOptional()
    montoRestante?: number;
}
