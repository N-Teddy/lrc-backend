import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from '@app/database/entities/log/audit-log.entity';
import { SystemLog } from '@app/database/entities/log/system-log.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(SystemLog)
    private readonly systemLogRepo: Repository<SystemLog>,
    private readonly configService: ConfigService,
  ) {}

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    const retentionDays = this.configService.get<number>(
      'LOG_RETENTION_DAYS_DB',
      30,
    );
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(
      `Starting log cleanup. Removing entries older than ${retentionDays} days (before ${cutoffDate.toISOString()})...`,
    );

    try {
      // 1. Cleanup Audit Logs (uses createdAt)
      const auditResult = await this.auditLogRepo.delete({
        createdAt: LessThan(cutoffDate),
      });
      this.logger.log(
        `Cleaned up ${auditResult.affected || 0} audit log entries.`,
      );

      // 2. Cleanup System Logs (uses timestamp)
      const systemResult = await this.systemLogRepo.delete({
        timestamp: LessThan(cutoffDate),
      });
      this.logger.log(
        `Cleaned up ${systemResult.affected || 0} system log entries.`,
      );

      this.logger.log('Log cleanup completed successfully.');
    } catch (error) {
      this.logger.error('Failed to complete log cleanup', error);
    }
  }

  // Helper to trigger cleanup manually if needed
  runManualCleanup(days?: number) {
    const retentionDays =
      days || this.configService.get<number>('LOG_RETENTION_DAYS_DB', 30);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return this.handleCleanup();
  }
}
