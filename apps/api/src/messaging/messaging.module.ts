import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaClient } from '../messaging/kafka.client';
import { KafkaProducer } from './kafka.producer';

@Module({
  imports: [ConfigModule], // pega ConfigService
  providers: [KafkaClient, KafkaProducer],
  exports: [KafkaClient, KafkaProducer], // <- ESSENCIAL (OrdersModule precisa enxergar)
})
export class MessagingModule {}
