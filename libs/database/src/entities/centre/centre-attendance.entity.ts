import { Entity, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../base.entity';
import { CentreActivity } from './centre-activity.entity';
import { Person } from '../core/person.entity';

@Entity('attendance', { schema: 'centre' })
export class CentreAttendance extends BaseEntity {
  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => CentreActivity)
  @JoinColumn({ name: 'activity_id' })
  activity: CentreActivity;

  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @ManyToOne(() => Person)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'member_id', type: 'uuid', nullable: true })
  memberId: string | null;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}