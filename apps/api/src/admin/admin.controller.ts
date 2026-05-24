import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { KafkaProducer } from '../messaging/kafka.producer';
import { TOPICS } from '../messaging/topics';
import { ReprocessDtoSchema } from './dto/reprocess.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly producer: KafkaProducer) {}

  @UseGuards(AdminGuard)
  @Post('dlq/reprocess')
  async reprocess(@Body() body: unknown) {
    const parsed = ReprocessDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('invalid body');
    }

    const { originalEvent } = parsed.data;

    await this.producer.send(TOPICS.ORDERS_CREATED, originalEvent, {
      correlationId: originalEvent.correlationId,
      idempotencyKey: originalEvent.idempotencyKey,
      eventType: originalEvent.type,
    });

    return { ok: true };
  }
}
