import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { UrgencyLevel } from '@prisma/client';

export class CreateDispatchDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    link?: string;

    @IsUUID()
    @IsNotEmpty()
    recipientId: string;

    @IsEnum(UrgencyLevel)
    @IsOptional()
    urgencyLevel?: UrgencyLevel;

    @IsDateString()
    @IsOptional()
    dueDate?: string;
}
