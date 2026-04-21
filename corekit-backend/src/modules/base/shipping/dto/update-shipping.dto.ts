import { PartialType } from '@nestjs/swagger';
import { CreateShippingZoneDto, CreateShippingRuleDto } from './create-shipping.dto.js';

export class UpdateShippingZoneDto extends PartialType(CreateShippingZoneDto) {}
export class UpdateShippingRuleDto extends PartialType(CreateShippingRuleDto) {}
