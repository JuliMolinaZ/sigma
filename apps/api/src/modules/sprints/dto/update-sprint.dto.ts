import { PartialType } from '@nestjs/mapped-types';
import { CreateSprintDto } from './create-sprint.dto';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateSprintDto extends PartialType(CreateSprintDto) {
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    memberIds?: string[];
}
