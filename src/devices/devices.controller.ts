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
    return this.getOrFetchData(id, req.user.userId, 'state', 'status');
  }

  @Get(':id/getOutputs')
  async getOutputs(@Param('id') id: string, @Request() req: any) {
    return this.getOrFetchData(id, req.user.userId, 'outputs', 'outputs');
  }

  @Get(':id/getSensors')
  async getSensors(@Param('id') id: string, @Request() req: any) {
    return this.getOrFetchData(id, req.user.userId, 'sensors', 'sensors');
  }

  @Get(':id/getConfig')
  async getConfig(@Param('id') id: string, @Request() req: any) {
    return this.getOrFetchData(id, req.user.userId, 'config', 'config');
  }

  @Get(':id/scanNetwork')
  async onScanNetwork(@Param('id') id: string, @Request() req: any) {
    // Scan network is an action, always use tunnel
    return this.sendDeviceCommand(id, req.user.userId, 'scanNetwork');
  }

  private async getOrFetchData(
    deviceId: string,
    userId: string,
    dbField: 'state' | 'config' | 'sensors' | 'outputs',
    cmd: string,
  ) {
    const device = await this.devicesService.findOne(deviceId);
    if (!device) {
      return { error: 'Device not found' };
    }

    // Check freshness
    const now = new Date().getTime();
    const lastUpdate = device.last_state_update
      ? device.last_state_update.getTime()
      : 0;
    const diff = now - lastUpdate;
    // TODO: implement freshness check
    let isFresh = false;
    if (dbField === 'state') {
      isFresh = diff < 10000;
    } else {
      isFresh = !!device[dbField];
    }

    if (isFresh && device[dbField]) {
      return device[dbField];
    }

    // Fallback: Tunnel
    return this.sendDeviceCommand(deviceId, userId, cmd);
  }

  private async sendDeviceCommand(
    deviceId: string,
    userId: string,
    cmd: string,
  ) {
    const device = await this.devicesService.findOne(deviceId);
    if (!device) {
      return { error: 'Device not found' };
    }
    const serial_number = device.serial_number;
    const responseTopic = `mars/${userId}/device/${serial_number}/${cmd}`;
    const topic = `mars/devices/${serial_number}/data`;
    const body = {
      cmd: cmd,
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
