import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('test/hello')
  testMqtt(@Payload() data: any, @Ctx() context: MqttContext) {
    console.log(`[MQTT] Received message on topic "test/hello":`, data);
    return `Hello from Backend! Received: ${data}`;
  }
}
