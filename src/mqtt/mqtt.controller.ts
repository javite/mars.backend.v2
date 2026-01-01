import { Controller, Inject, forwardRef } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { DevicesService } from '../devices/devices.service';

@Controller()
export class MqttController {
  constructor(
    @Inject(forwardRef(() => DevicesService))
    private devicesService: DevicesService,
  ) {}

  @MessagePattern('mars/+/device/+/+')
  handleWildcard(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    // Example topic: mars/user123/device/dev001/status
    const parts = topic.split('/');

    if (parts.length >= 5 && parts[2] === 'device') {
      const serial = parts[3];
      const type = parts[4];
      this.devicesService.updateFromMqtt(serial, type, data);
    } else {
      console.log(`[MQTT] Received on ${topic}:`, data);
    }
  }
}
