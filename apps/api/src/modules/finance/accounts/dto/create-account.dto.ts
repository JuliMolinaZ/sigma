import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
    @IsString()
    name: string;

    @IsString()
    code: string;

    @IsEnum(AccountType)
    type: AccountType;

    @IsString()
    @IsOptional()
    description?: string;
}
