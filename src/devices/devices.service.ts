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

  async findOne(serial_number: string) {
    return this.devicesRepository.findOneBy({ serial_number });
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
}
