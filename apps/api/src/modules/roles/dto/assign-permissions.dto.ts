import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
    @IsArray()
    @IsNotEmpty()
    @IsUUID('4', { each: true })
    permissionIds: string[];
}
