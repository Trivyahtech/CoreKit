import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Request,
  Headers,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { VerifyPaymentDto } from './dto/update-payment.dto.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'List the payment providers the tenant has configured' })
  providers() {
    const razorpayKeyId = this.config.get<string>('payments.razorpayKeyId');
    const razorpaySecret = this.config.get<string>('payments.razorpayKeySecret');
    return {
      providers: [
        { id: 'COD', name: 'Cash on Delivery', enabled: true },
        {
          id: 'RAZORPAY',
          name: 'Online payment (Razorpay)',
          enabled: !!(razorpayKeyId && razorpaySecret),
        },
      ],
    };
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Initiate a payment for an order' })
  initiate(@Request() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.initiate(req.user.id, req.user.tenantId, dto);
  }

  @ApiBearerAuth()
  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify a gateway payment from the client (requires signature)' })
  verify(@Param('id') id: string, @Body() dto: VerifyPaymentDto, @Request() req: any) {
    return this.paymentsService.verify(id, dto, req.user.id, req.user.tenantId);
  }

  @Public()
  @Post('webhook/razorpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay server-to-server webhook (signature required)' })
  razorpayWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string | undefined,
  ) {
    const rawBody: string =
      req.rawBody?.toString?.('utf8') ?? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    return this.paymentsService.handleRazorpayWebhook(rawBody, signature);
  }

  @ApiBearerAuth()
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments for an order' })
  findByOrder(@Param('orderId') orderId: string, @Request() req: any) {
    return this.paymentsService.findByOrder(orderId, req.user.id);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
