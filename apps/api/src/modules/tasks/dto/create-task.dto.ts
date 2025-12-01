import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsDateString, Min } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @IsUUID()
    projectId: string;

    @IsUUID()
    @IsOptional()
    sprintId?: string;

    @IsUUID()
    @IsOptional()
    assigneeId?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    position?: number;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    estimatedHours?: number;

    @IsString()
    @IsOptional()
    driveLink?: string;

    @IsString()
    @IsOptional()
    initialComment?: string;
}
