import { registerAs } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { AppCode } from '@app/types';

const logger = new Logger('Configuration');

export const configSchema = z.object({
  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // App
  APP_NAME: z.string().default('LRC Ecosystem'),
  APP_CODE: z.nativeEnum(AppCode).default(AppCode.JRS),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_NAME: z.string().default('lrc_db'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRE_AT: z.coerce.number().default(3600), // in seconds
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRE_AT: z.coerce.number().default(604800), // 7 days in seconds
  JWT_RESET_SECRET: z.string().min(32),
  JWT_RESET_EXPIRE_AT: z.coerce.number().default(3600),

  // Email
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.coerce.number(),
  EMAIL_SECURE: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Notification
  NOTIFICATION_RETRY_ATTEMPTS: z.coerce.number().default(3),
  NOTIFICATION_RETRY_BASE_DELAY: z.coerce.number().default(1000),

  // Service Specific Ports
  AUTH_PORT: z.coerce.number().default(3001),
  JRS_PORT: z.coerce.number().default(3002),
  ADMIN_PORT: z.coerce.number().default(3003),
  CENTRE_PORT: z.coerce.number().default(3004),

  // Operational Limits
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Seeding
  SEED_DB: z.coerce.boolean().default(false),
  FRONTEND_URL: z.string().url(),
  JWT_INVITE_SECRET: z.string().min(32),
  JWT_INVITE_EXPIRE_AT: z.coerce.number().default(86400), // 7 days in seconds for super admin invite

  // Storage
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOAD_BASE_URL: z.string().default('http://localhost:3001'),
});

export type Config = z.infer<typeof configSchema>;

export default registerAs('app', () => ({
  env: process.env.NODE_ENV,
  name: process.env.APP_NAME,
  code: process.env.APP_CODE || AppCode.JRS,
  url: process.env.APP_URL,
  port: parseInt(process.env.PORT!) || 3000,
  corsOrigin: process.env.CORS_ORIGIN?.split(','),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10),
    max: parseInt(process.env.RATE_LIMIT_MAX!, 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: parseInt(process.env.JWT_EXPIRE_AT!, 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRE_AT!, 10),
  },
  adminPort: parseInt(process.env.ADMIN_PORT!, 10) || 3003,
  seedDb: process.env.SEED_DB === 'true',
  frontendUrl: process.env.FRONTEND_URL,
  jwtInviteSecret: process.env.JWT_INVITE_SECRET,
  jwtInviteExpireAt: parseInt(process.env.JWT_INVITE_EXPIRE_AT!, 10) || 86400,
}));

export const validateConfig = (config: Record<string, unknown>) => {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    logger.error('❌ Invalid environment configuration:');
    logger.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment validation failed');
  }

  return result.data;
};
