import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditActionEnum } from '@app/types';

@Entity('audit_logs', { schema: 'logs' })
@Index(['createdAt'])
@Index(['userId', 'entity'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: AuditActionEnum,
    default: AuditActionEnum.OTHER,
  })
  action: AuditActionEnum;

  @Column()
  entity: string;

  @Column({ nullable: true })
  route: string;

  @Column()
  method: string;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column('jsonb', { name: 'request_body', nullable: true })
  requestBody: Record<string, unknown>;

  @Column('jsonb', { name: 'request_headers' })
  requestHeaders: Record<string, unknown>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
