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

  // 2. Configurar el Microservicio MQTT
  // IMPORTANTE: Escuchamos internamente en el 1883. 
  // Railway redirigirá el tráfico del puerto 23568 (externo) a este.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: `mqtt://0.0.0.0:1883`, 
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