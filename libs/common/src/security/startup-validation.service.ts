import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StartupValidationService {
  private readonly logger = new Logger(StartupValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  validateJwtSecrets(): void {
    const requiredSecrets: Array<{
      key: string;
      description: string;
    }> = [
      { key: 'JWT_SECRET', description: 'Access token signing secret' },
      {
        key: 'JWT_REFRESH_SECRET',
        description: 'Refresh token signing secret',
      },
      {
        key: 'JWT_RESET_SECRET',
        description: 'Password reset token signing secret',
      },
      { key: 'JWT_INVITE_SECRET', description: 'Invite token signing secret' },
    ];

    const missing: string[] = [];
    const tooShort: string[] = [];

    for (const { key, description } of requiredSecrets) {
      const value = this.configService.get<string>(key);
      if (!value) {
        missing.push(`${key} (${description})`);
      } else if (value.length < 32) {
        tooShort.push(
          `${key} (${description}) — currently ${value.length} chars, needs >= 32`,
        );
      }
    }

    if (missing.length > 0) {
      this.logger.error(`Missing required JWT secrets: ${missing.join(', ')}`);
      throw new Error(
        `Startup validation failed: Missing required JWT secrets: ${missing.join(', ')}`,
      );
    }

    if (tooShort.length > 0) {
      this.logger.error(
        `JWT secrets are too short (minimum 32 characters required): ${tooShort.join('; ')}`,
      );
      throw new Error(
        `Startup validation failed: JWT secrets must be at least 32 characters long.`,
      );
    }

    this.logger.log(
      'JWT secret validation passed — all required secrets are present and strong.',
    );
  }
}
