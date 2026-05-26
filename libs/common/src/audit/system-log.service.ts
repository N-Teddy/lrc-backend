import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from '@app/database/entities/log/system-log.entity';

@Injectable()
export class SystemLogService {
  constructor(
    @InjectRepository(SystemLog)
    private readonly systemLogRepository: Repository<SystemLog>,
  ) {}

  async create(
    level: string,
    message: string,
    context?: string,
    service?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const log = this.systemLogRepository.create({
        level,
        message,
        context,
        service: service || 'unknown',
        metadata,
      });
      return await this.systemLogRepository.save(log);
    } catch (error) {
      console.error('Critical: Failed to save system log to DB', error);
    }
  }

  logError(
    message: string,
    context: string,
    service: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.create('error', message, context, service, metadata);
  }
}
