import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsArray, IsNotEmpty } from 'class-validator';
import { ProjectStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
    @ApiProperty({ example: 'Website Redesign', description: 'The name of the project' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Redesigning the corporate website', description: 'Detailed description of the project' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING, description: 'Initial status of the project' })
    @IsEnum(ProjectStatus)
    @IsOptional()
    status?: ProjectStatus;

    @ApiPropertyOptional({ example: '2023-01-01T00:00:00Z', description: 'Start date of the project' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ example: '2023-12-31T00:00:00Z', description: 'End date of the project' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({ example: 'uuid-string', description: 'ID of the project owner (defaults to creator)' })
    @IsUUID()
    @IsOptional()
    ownerId?: string;

    @ApiPropertyOptional({ example: ['uuid-string-1', 'uuid-string-2'], description: 'IDs of project owners' })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true }) // Assuming UUID v4
    ownerIds?: string[];

    @ApiPropertyOptional({ example: 'uuid-string', description: 'ID of the client' })
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({ example: 'uuid-string', description: 'ID of the project phase' })
    @IsUUID()
    @IsOptional()
    phaseId?: string;

    @ApiPropertyOptional({ example: ['uuid-string-1', 'uuid-string-2'], description: 'IDs of team members (Operators/Developers)' })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    memberIds?: string[];
}
