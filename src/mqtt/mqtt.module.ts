import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesModule } from '../devices/devices.module';
import { MqttController } from './mqtt.controller';

@Module({
    imports: [DevicesModule],
    controllers: [MqttController],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule { }
