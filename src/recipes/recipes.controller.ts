import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MqttService } from '../mqtt/mqtt.service';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
    constructor(
        private recipesService: RecipesService,
        private mqttService: MqttService,
    ) { }

    @Get(':id/getActualProgram')
    async getActualProgram(@Param('id') deviceId: string, @Request() req: any) {
        const userId = req.user.userId;
        const topic = `mars/${userId}/device/${deviceId}/status`;
        const responseTopic = `mars/devices/${deviceId}/data`;
        const body = {
            cmd: "getActualProgram"
        };
        // console.log(`Sending command to ${topic} and waiting for response on ${responseTopic}`, body);

        try {
            const response = await this.mqttService.publishToTopicAndWaitForMessage(topic, body, responseTopic, 5000);
            return response;
        } catch (error) {
            return error;
        }
    }

    @Post()
    create(@Body() body: any, @Request() req: any) {
        return this.recipesService.create({ ...body, ownerId: req.user.userId });
    }

    @Get()
    findAll(@Request() req: any) {
        return this.recipesService.findAllByOwner(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.recipesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.recipesService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.recipesService.remove(id);
    }
}
