import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { JrsModule } from './jrs.module';
import { setupApp } from '@app/common';
import { Logger } from '@nestjs/common';
import { AppCode } from '@app/types';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  // Set the app code for this service
  process.env.APP_CODE = AppCode.JRS;

  const logger = new Logger('JrsBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(JrsModule);

  const configService = app.get(ConfigService);
  setupApp(app, 'JRS', 'bluePlanet');

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const port = process.env.JRS_PORT || 3002;
  await app.listen(port);

  logger.log(`JRS Service is running on: http://localhost:${port}/api`);
  logger.log(`API Documentation available at: http://localhost:${port}/docs`);

  const socketAdminEnabled = configService.get<boolean>(
    'SOCKET_ADMIN_ENABLED',
    process.env.NODE_ENV !== 'production',
  );
  if (socketAdminEnabled) {
    logger.log(
      `Socket.IO Admin UI available at: http://localhost:${port}/socket.io/admin`,
    );
  }
}

void bootstrap();
