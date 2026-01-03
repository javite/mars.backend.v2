import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesModule } from '../devices/devices.module';
import { MqttController } from './mqtt.controller';
import { ConfigModule } from '@nestjs/config';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => DevicesModule),
    forwardRef(() => RecipesModule),
  ],
  controllers: [MqttController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
