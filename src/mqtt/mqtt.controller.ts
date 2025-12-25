import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';

@Controller()
export class MqttController {

    @MessagePattern('mars/+/device/+/+')
    handleWildcard(@Payload() data: any, @Ctx() context: MqttContext) {
        const topic = context.getTopic();
        // Example topic: mars/user123/device/dev001/status
        const parts = topic.split('/');

        // parts[0] = mars
        // parts[1] = userId
        // parts[2] = device
        // parts[3] = deviceId
        // parts[4] = type (status, command, etc.)

        const userId = parts[1];
        const deviceId = parts[3];
        const type = parts[4];

        if (type === 'status') {
            console.log(`[Status] User: ${userId}, Device: ${deviceId}`, data);
            // TODO: Call DevicesService to update status in DB
        } else {
            console.log(`[MQTT] Received on ${topic}:`, data);
        }
    }

    @MessagePattern('mars/devices/+/data')
    handleDataResponse(@Payload() data: any, @Ctx() context: MqttContext) {
        const topic = context.getTopic();
        const parts = topic.split('/');

        // parts[0] = mars
        // parts[1] = devices
        // parts[2] = deviceId
        // parts[3] = data

        const deviceId = parts[2];
        console.log("Device Id: ", deviceId);
        console.log(`[MQTT] Data received on ${topic}:`, data);

    }
}
