import { PartialType } from '@nestjs/mapped-types';
import { CreateDispatchDto } from './create-dispatch.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DispatchStatus } from '@prisma/client';

export class PatchDispatchDto extends PartialType(CreateDispatchDto) {
    @IsEnum(DispatchStatus)
    @IsOptional()
    status?: DispatchStatus;

    @IsString()
    @IsOptional()
    resolutionNote?: string;
}
