import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
    constructor(private devicesService: DevicesService) { }

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
