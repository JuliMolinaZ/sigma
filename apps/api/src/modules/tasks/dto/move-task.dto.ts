import { IsEnum, IsNumber, Min } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class MoveTaskDto {
    @IsEnum(TaskStatus)
    status: TaskStatus;

    @IsNumber()
    @Min(0)
    position: number;
}
