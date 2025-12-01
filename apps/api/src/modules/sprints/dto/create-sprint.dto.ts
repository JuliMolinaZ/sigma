import { IsString, IsDateString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateSprintDto {
    @IsString()
    name: string;

    @IsUUID()
    projectId: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsString()
    @IsOptional()
    goal?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    memberIds?: string[];
}
