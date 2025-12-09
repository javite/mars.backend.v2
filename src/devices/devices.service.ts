import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
    constructor(
        @InjectRepository(Device)
        private devicesRepository: Repository<Device>,
    ) { }

    async create(deviceData: Partial<Device>) {
        return this.devicesRepository.save(deviceData);
    }

    async findAllByOwner(ownerId: string) {
        return this.devicesRepository.find({ where: { ownerId } });
    }

    async findOne(macAddress: string) {
        return this.devicesRepository.findOneBy({ macAddress });
    }

    async updateStatus(macAddress: string, status: string) {
        await this.devicesRepository.update(macAddress, { status });
    }

    async findAll(limit: number, offset: number) {
        return this.devicesRepository.findAndCount({
            take: limit,
            skip: offset,
        });
    }
}
