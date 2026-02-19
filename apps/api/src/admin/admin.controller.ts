import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { KafkaProducer } from '../messaging/kafka.producer';
import { TOPICS } from '../messaging/topics';
import { ReprocessDto } from './dto/reprocess.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly producer: KafkaProducer) {}

  @UseGuards(AdminGuard)
  @Post('dlq/reprocess')
  async reprocess(@Body() body: ReprocessDto) {
    const originalEvent = body?.originalEvent;
    if (!originalEvent) return { ok: false, error: 'missing originalEvent' };

    await this.producer.send(TOPICS.ORDERS_CREATED, originalEvent, {
      correlationId: originalEvent.correlationId,
      idempotencyKey: originalEvent.idempotencyKey,
      eventType: originalEvent.type,
    });

    return { ok: true };
  }
}
