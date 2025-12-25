import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configuración de Pipes Globales
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const configService = app.get(ConfigService);

  // 2. Configurar el Cliente del Microservicio MQTT
  // Esto permite al backend suscribirse y recibir mensajes del broker Mosquitto.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: configService.get('MQTT_URL') || `mqtt://127.0.0.1:1883`,
      username: configService.get('MQTT_USERNAME'),
      password: configService.get('MQTT_PASSWORD'),
    },
  });

  // 3. Iniciar Microservicios (Esto permite que MQTT corra en paralelo con HTTP)
  await app.startAllMicroservices();

  // 4. Iniciar la aplicación HTTP (API REST)
  // Usamos '0.0.0.0' para asegurar que acepte conexiones externas en Railway
  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`HTTP API listening on port: ${port}`);
  console.log(`MQTT Microservice listening on port: 1883`);
}
bootstrap(); 