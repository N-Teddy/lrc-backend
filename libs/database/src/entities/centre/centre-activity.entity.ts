import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../base.entity';
import { CentreActivityType, ActivityStatus, ActivityScope } from '@app/types';
import { CentreAttendance } from './centre-attendance.entity';
import { Town } from '../core/town.entity';

@Entity('activities', { schema: 'centre' })
export class CentreActivity extends BaseEntity {
  @Column({ name: 'town_id', type: 'uuid', nullable: true })
  townId: string | null;

  @ManyToOne(() => Town, { nullable: true })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId: string;

  @Column({ name: 'originating_centre_id', type: 'uuid', nullable: true })
  originatingCentreId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CentreActivityType,
  })
  activityType: CentreActivityType;

  @Column({ nullable: true })
  location: string;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'is_conference', default: false })
  isConference: boolean;

  @Column({
    type: 'enum',
    enum: ActivityScope,
    default: ActivityScope.TOWN,
  })
  scope: ActivityScope;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.PROGRAMMED,
  })
  status: ActivityStatus;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @Column({ name: 'locked_by_id', type: 'uuid', nullable: true })
  lockedById: string | null;

  @Column({ name: 'target_groups', type: 'varchar', length: 100, nullable: true })
  targetGroups: string | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => CentreAttendance, (attendance) => attendance.activity)
  attendanceRecords: CentreAttendance[];
}