import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@app/database/entities/log/audit-log.entity';
import { AuditActionEnum } from '@app/types';

export interface CreateAuditLogDto {
  userId: string;
  action: AuditActionEnum;
  entity: string;
  route: string;
  method: string;
  requestBody?: Record<string, unknown>;
  requestHeaders?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  serviceName: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(dto: CreateAuditLogDto) {
    const log = this.auditLogRepository.create(dto);
    return await this.auditLogRepository.save(log);
  }
}
