import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Device]),
        ClientsModule.registerAsync([
            {
                name: 'MQTT_CLIENT',
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.MQTT,
                    options: {
                        url: configService.get('MQTT_URL') || 'mqtt://127.0.0.1:1883',
                        username: configService.get('MQTT_USERNAME'),
                        password: configService.get('MQTT_PASSWORD'),
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [DevicesController],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule { }
