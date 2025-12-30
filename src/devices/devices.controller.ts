import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Inject,
  Delete,
  Patch,
} from '@nestjs/common';
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
  ) {}

  @Get(':id/getLocalData')
  async getLocalData(@Param('id') id: string, @Request() req: any) {
    const device = await this.devicesService.findOne(id);
    if (!device) {
      return { error: 'Device not found' };
    }
    const serial_number = device.serial_number;
    const userId = req.user.userId;
    const topic = `mars/${userId}/device/${serial_number}/status`;
    const responseTopic = `mars/devices/${serial_number}/data`;
    const body = {
      cmd: 'getLocalData',
    };

    try {
      const response = await this.mqttService.publishToTopicAndWaitForMessage(
        topic,
        body,
        responseTopic,
        5000,
      );
      return response;
    } catch (error) {
      return error;
    }
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const device = {
      macAddress: body.macAddress,
      name: body.name,
      ownerId: req.user.userId,
      status: 'offline',
      current_program_id: body.current_program_id,
      model: body.model,
      version: body.version,
      firmware_version: body.firmware_version,
      serial_number: body.serial_number,
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.devicesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
