import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from '../../entities/webhook.entity';
import { WebhookDelivery } from '../../entities/webhook-delivery.entity';
import { NotifyService } from './notify.service';
import { NotifyController } from './notify.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Webhook, WebhookDelivery])],
  controllers: [NotifyController],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
