import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { setupApp } from '@app/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppCode } from '@app/types';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  // Set the app code for this service
  process.env.APP_CODE = AppCode.ADMIN;

  const logger = new Logger('AdminBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AdminModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('ADMIN_PORT', 3003);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  setupApp(app, 'Admin', 'mars');

  await app.listen(port);

  logger.log(`Admin Service is running on: http://localhost:${port}/api`);
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
