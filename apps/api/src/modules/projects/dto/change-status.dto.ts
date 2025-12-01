import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeProjectStatusDto {
    @ApiProperty({ enum: ProjectStatus, description: 'The new status of the project' })
    @IsEnum(ProjectStatus)
    status: ProjectStatus;
}
