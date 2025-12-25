import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const configService = app.get(ConfigService);

  // 1) HTTP primero
  const port = Number(configService.get('PORT') ?? process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`HTTP API listening on port: ${port}`);

  // 2) Luego MQTT (sin bloquear el arranque del HTTP)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: configService.get('MQTT_URL') || 'mqtt://127.0.0.1:1883',
      username: configService.get('MQTT_USERNAME'),
      password: configService.get('MQTT_PASSWORD'),
    },
  });

  app.startAllMicroservices().then(() => {
    console.log(`MQTT microservice connected/started`);
  }).catch((err) => {
    console.error('MQTT microservice failed to start:', err?.message || err);
    // IMPORTANT: NO tirar abajo el HTTP por esto
  });
}

bootstrap();
