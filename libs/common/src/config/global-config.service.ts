import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

@Injectable()
export class GlobalConfigService {
  private readonly logger = new Logger(GlobalConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  public getValue<T = unknown>(key: string, throwOnMissing = true): T {
    const value = this.configService.get<T>(key);
    if (value === undefined && throwOnMissing) {
      this.logger.error(`Configuration error - missing env.${key}`);
      throw new Error(`Configuration error - missing env.${key}`);
    }
    return value!;
  }

  public isProduction(): boolean {
    return this.getValue('NODE_ENV') === 'production';
  }

  public getJwtOptions(): JwtModuleOptions {
    return {
      secret: this.getValue('JWT_SECRET'),
      signOptions: {
        expiresIn: this.getValue<number>('JWT_EXPIRE_AT'),
      },
    };
  }

  public getPort(service: 'AUTH' | 'JRS'): number {
    return this.getValue(`${service}_PORT`);
  }

  public getAppUrl(): string {
    return this.getValue('APP_URL');
  }

  public getRateLimitConfig() {
    return {
      windowMs: this.getValue<number>('RATE_LIMIT_WINDOW_MS'),
      max: this.getValue<number>('RATE_LIMIT_MAX'),
    };
  }
}
