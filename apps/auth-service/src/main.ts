import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { setupApp } from '@app/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppCode } from '@app/types';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  // Set the app code for this service
  process.env.APP_CODE = AppCode.AUTH;

  const logger = new Logger('AuthBootstrap');
  const app =
    await NestFactory.create<NestExpressApplication>(AuthServiceModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('AUTH_PORT', 3001);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  setupApp(app, 'Auth', 'purple');

  await app.listen(port);

  logger.log(`Auth Service is running on: http://localhost:${port}/api`);
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
