import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Inject } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { MqttService } from '../mqtt/mqtt.service';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
    constructor(
        private devicesService: DevicesService,
        private mqttService: MqttService,
    ) { }

    @Post(':id/command')
    async sendCommand(@Param('id') deviceId: string, @Body() body: any, @Request() req: any) {
        const userId = req.user.userId;
        const topic = `mars/${userId}/device/${deviceId}/status`;
        const responseTopic = `mars/devices/${deviceId}/data`;

        console.log(`Sending command to ${topic} and waiting for response on ${responseTopic}`, body);

        try {
            const response = await this.mqttService.publishToTopicAndWaitForMessage(topic, body, responseTopic, 5000);
            return { success: true, response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @Post()
    async create(@Body() body: any, @Request() req: any) {
        const device = {
            macAddress: body.macAddress,
            name: body.name,
            ownerId: req.user.userId,
            status: 'offline'
        };
        // TODO: complex logic to verify ownership or secret
        return this.devicesService.create(device);
    }

    @Get('all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAllAdmin(@Query('limit') limit = 10, @Query('offset') offset = 0) {
        return this.devicesService.findAll(limit, offset);
    }

    @Get()
    async findAll(@Request() req: any) {
        return this.devicesService.findAllByOwner(req.user.userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.devicesService.findOne(id);
    }
}
