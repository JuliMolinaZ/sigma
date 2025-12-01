import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateModuleVisibilityDto } from './update-module-visibility.dto';

export class BatchUpdateModulesDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateModuleVisibilityDto)
    modules: UpdateModuleVisibilityDto[];
}
