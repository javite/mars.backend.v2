import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class DevicesService implements OnModuleInit {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
  ) {}

  onModuleInit() {
    this.mqttService.subscribe('mars/+/device/+/+', (topic, payload) => {
      const parts = topic.split('/');
      // Topic format: mars/{userId}/device/{serial}/{type}
      // parts[0] = mars
      // parts[1] = userId
      // parts[2] = device
      // parts[3] = serial
      // parts[4] = type (status, config, etc)

      if (parts.length >= 5 && parts[2] === 'device') {
        const serial = parts[3];
        const type = parts[4];
        this.updateFromMqtt(serial, type, payload);
      }
    });
  }

  async create(deviceData: Partial<Device>) {
    return this.devicesRepository.save(deviceData);
  }

  async findAllByOwner(ownerId: string) {
    return this.devicesRepository.find({ where: { ownerId } });
  }

  async findOne(id: string) {
    return this.devicesRepository.findOne({
      where: { id },
      relations: ['active_recipe'],
    });
  }

  async update(id: string, updateDeviceDto: Partial<Device>) {
    await this.devicesRepository.update(id, updateDeviceDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return this.devicesRepository.delete(id);
  }

  async updateStatus(macAddress: string, status: string) {
    await this.devicesRepository.update({ macAddress }, { status });
  }

  async findAll(limit: number, offset: number) {
    return this.devicesRepository.findAndCount({
      take: limit,
      skip: offset,
    });
  }

  async updateFromMqtt(macAddress: string, type: string, payload: any) {
    const device = await this.devicesRepository.findOne({
      where: { macAddress },
    });
    if (!device) return;

    device.last_seen = new Date();

    if (type === 'status') {
      device.state = payload;
      device.last_state_update = new Date();
    } else if (type === 'config') {
      device.config = payload;
    } else if (type === 'sensors') {
      device.sensors = payload;
    } else if (type === 'outputs') {
      device.outputs = payload;
    } else if (type === 'active_recipe') {
      // TODO: enviar recipeId o similar
      device.active_recipe_id = payload.recipeId || payload.id;
    }

    await this.devicesRepository.save(device);
  }
}
