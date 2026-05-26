/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import basicAuth from 'express-basic-auth';
import { createLoggerConfig } from './logger/winston.config';
import type { Request, Response, NextFunction } from 'express';

type ScalarTheme =
  | 'default'
  | 'alternate'
  | 'moon'
  | 'purple'
  | 'solarized'
  | 'bluePlanet'
  | 'saturn'
  | 'kepler'
  | 'mars'
  | 'deepSpace';

import express from 'express';

export function setupApp(
  app: INestApplication,
  serviceName: string,
  theme: ScalarTheme = 'purple',
) {
  // 1. Logger
  app.useLogger(createLoggerConfig(serviceName));

  // 2. Global Prefix & Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 3. Security & Performance
  // Exclude Socket.IO paths from helmet so the admin UI and WS handshakes are not blocked
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path?.startsWith('/socket.io')) {
      return next();
    }

    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `https://cdn.jsdelivr.net`],
          styleSrc: [`'self'`, `'unsafe-inline'`, `https://cdn.jsdelivr.net`],
          imgSrc: [`'self'`, `data:`, `https://cdn.jsdelivr.net`],
        },
      },
    })(req, res, next);
  });
  app.use(compression());

  // 3a. Tiered Rate Limiting
  const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests/minute for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication requests, please try again later.',
  });

  const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests/minute for write endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many write requests, please try again later.',
  });

  const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests/minute for read endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  });

  app.use('/api/auth/', authLimiter);
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return writeLimiter(req, res, next);
    }
    return readLimiter(req, res, next);
  });

  // 3b. CORS — require explicit origin list, no wildcard fallback
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [];
  if (corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGIN environment variable must be set with a comma-separated list of allowed origins',
    );
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3c. Body Size Limits — prevent DoS via large payloads
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // 4. Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Note: Global Filters and Interceptors are handled via APP_FILTER and APP_INTERCEPTOR in CommonModule
  // This allows them to use dependency injection (e.g. for SystemLogService)

  // 5. Graceful Shutdown
  app.enableShutdownHooks();

  // 6. Scalar Documentation
  const config = new DocumentBuilder()
    .setTitle(`${serviceName} API`)
    .setDescription(`The ${serviceName} service API documentation`)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add basic auth protection for /docs in all environments — require explicit credentials
  const docsUsername = process.env.DOCS_USERNAME;
  const docsPassword = process.env.DOCS_PASSWORD;
  if (!docsUsername || !docsPassword) {
    throw new Error(
      'DOCS_USERNAME and DOCS_PASSWORD environment variables must be set',
    );
  }

  app.use(
    '/docs',
    basicAuth({
      challenge: true,
      users: { [docsUsername]: docsPassword },
    }),
  );

  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: theme,
    }),
  );
}
