import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
    @ApiProperty({ example: 'users', description: 'Resource name' })
    @IsString()
    @IsNotEmpty()
    resource: string;

    @ApiProperty({ example: 'create', description: 'Action name' })
    @IsString()
    @IsNotEmpty()
    action: string;

    @ApiProperty({ example: 'Create new users', description: 'Permission description', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}
