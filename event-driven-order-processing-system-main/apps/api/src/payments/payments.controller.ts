import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('webhooks')
  handleWebhook(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.payments.handleWebhook(body, { correlationId });
  }
}
