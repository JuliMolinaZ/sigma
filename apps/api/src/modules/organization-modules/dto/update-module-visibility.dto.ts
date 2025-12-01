import { IsString, IsBoolean } from 'class-validator';

export class UpdateModuleVisibilityDto {
    @IsString()
    moduleId: string;

    @IsBoolean()
    isEnabled: boolean;
}
