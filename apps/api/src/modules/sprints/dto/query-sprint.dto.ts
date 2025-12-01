import { IsOptional, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySprintDto {
    @IsUUID()
    @IsOptional()
    projectId?: string;

    @IsDateString()
    @IsOptional()
    startDateFrom?: string;

    @IsDateString()
    @IsOptional()
    startDateTo?: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;
}
