import { Controller, Inject, forwardRef } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { DevicesService } from '../devices/devices.service';
import { RecipesService } from '../recipes/recipes.service';

@Controller()
export class MqttController {
  constructor(
    @Inject(forwardRef(() => DevicesService))
    private devicesService: DevicesService,
    @Inject(forwardRef(() => RecipesService))
    private recipesService: RecipesService,
  ) {}

  @MessagePattern('mars/+/device/+/+')
  async handleWildcard(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    // mars/userId/device/serialNumber/type
    const parts = topic.split('/');
    if (parts.length < 5) return;

    const userId = parts[1];
    const serial = parts[3];
    const type = parts[4];

    // Exclude actualProgram (response topic)
    if (type === 'actualProgram') return;

    // Verify ownership for ALL messages to prevent stale data processing
    // This is especially critical for actualProgramID which triggers recipe sync
    const device = await this.devicesService.findOneBySerial(serial);

    // If device doesn't exist or owner mismatch, ignore.
    if (!device) {
      // console.log(`Device ${serial} not found, ignoring message on ${topic}`);
      return;
    }

    if (device.ownerId !== userId) {
      if (type === 'actualProgramID') {
        console.log(
          `[MQTT] Ignoring stale actualProgramID for ${serial} on topic ${topic} (owner mismatch)`,
        );
      }
      return;
    }

    if (type === 'actualProgramID') {
      this.recipesService.updateRecipeFromMqtt(serial, data);
    } else {
      this.devicesService.updateDeviceFromMqtt(serial, type, data);
    }
  }
}
