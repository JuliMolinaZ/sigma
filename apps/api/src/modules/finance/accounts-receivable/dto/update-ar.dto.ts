import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountReceivableDto } from './create-ar.dto';

export class UpdateAccountReceivableDto extends PartialType(CreateAccountReceivableDto) { }
