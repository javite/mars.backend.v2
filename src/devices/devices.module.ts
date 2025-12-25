import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Device]),
        forwardRef(() => MqttModule),
    ],
    controllers: [DevicesController],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule { }
