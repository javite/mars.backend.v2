import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesModule } from '../devices/devices.module';

@Module({
    imports: [DevicesModule],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule { }
