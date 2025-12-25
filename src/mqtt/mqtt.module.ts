import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesModule } from '../devices/devices.module';
import { MqttController } from './mqtt.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        forwardRef(() => DevicesModule),
    ],
    controllers: [MqttController],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule { }
