import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

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

  async updateFromMqtt(serial_number: string, type: string, payload: any) {
    const device = await this.devicesRepository.findOne({
      where: { serial_number },
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
    } else if (type === 'actualProgram') {
      console.log('Actual program received:', payload);
      // TODO: enviar recipeId o similar
      // device.active_recipe_id = payload.recipeId || payload.id;
    }

    await this.devicesRepository.save(device);
  }
}
