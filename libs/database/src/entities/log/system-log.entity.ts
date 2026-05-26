import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@app/database/base.entity';

@Entity('system_logs', { schema: 'logs' })
@Index(['timestamp'])
export class SystemLog extends BaseEntity {
  @Column()
  level: string;

  @Column()
  message: string;

  @Column({ nullable: true })
  context: string;

  @Column()
  service: string; // auth-service, finance-service, etc.

  @Column('jsonb', { nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz' })
  timestamp: Date;
}
