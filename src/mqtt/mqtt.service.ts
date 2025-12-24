import { Injectable, OnModuleInit } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import Aedes from 'aedes';
import * as net from 'net';

@Injectable()
export class MqttService implements OnModuleInit {
    private aedes: Aedes;
    private server: net.Server;

    constructor(private devicesService: DevicesService) { }

    async onModuleInit() {
        this.aedes = new Aedes();
        this.server = net.createServer(this.aedes.handle);
        const port = 1883;

        await new Promise<void>((resolve) => {
            this.server.listen(port, () => {
                console.log('MQTT Broker running on port', port);
                resolve();
            });
        });

        this.aedes.authenticate = async (client, username, password, callback) => {
            // Allow admin access for MQTT Explorer/Tools
            if (username === 'admin') {
                console.log('Admin connected via MQTT');
                callback(null, true);
                return;
            }

            const mac = client.id;
            console.log(`Client connecting: ${mac}`);
            // Check if device exists
            const device = await this.devicesService.findOne(mac);
            if (device) {
                callback(null, true);
            } else {
                console.log(`Device ${mac} not found`);
                const error = new Error('Device not authorized') as any;
                error.returnCode = 2; // Bad identifier
                callback(error, false);
            }
        };

        this.aedes.on('clientReady', (client) => {
            this.devicesService.updateStatus(client.id, 'online');
        });

        this.aedes.on('clientDisconnect', (client) => {
            this.devicesService.updateStatus(client.id, 'offline');
        });
    }
}
