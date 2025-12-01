
import { PartialType } from '@nestjs/mapped-types';
import { CreateFlowRecoveryDto } from './create-flow-recovery.dto';

export class UpdateFlowRecoveryDto extends PartialType(CreateFlowRecoveryDto) { }
