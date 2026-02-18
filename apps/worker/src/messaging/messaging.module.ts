import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaClient } from './kafka.client';

@Module({
  imports: [ConfigModule],
  providers: [KafkaClient],
  exports: [KafkaClient],
})
export class MessagingModule {}
