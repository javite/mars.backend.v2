import { Injectable, OnModuleInit } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class MqttService implements OnModuleInit {

    constructor(private devicesService: DevicesService) { }

    async onModuleInit() {
        console.log('MqttService: initializing (Client Mode)...');
        // TODO: Implement logic to subscribe to presence topics from Mosquitto if needed
    }
}
