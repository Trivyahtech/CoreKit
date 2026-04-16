import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'corekit-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
