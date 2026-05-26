import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Person } from '../core/person.entity';
import { JrsActivity } from './jrs-activity.entity';
import { JrsMember } from './jrs-member.entity';
import { BaseEntity } from '@app/database/base.entity';

@Entity('attendance', { schema: 'jrs' })
@Unique(['activityId', 'personId'])
@Index(['activityId'])
@Index(['personId'])
export class JrsAttendance extends BaseEntity {
  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => JrsActivity)
  @JoinColumn({ name: 'activity_id' })
  activity: JrsActivity;

  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @ManyToOne(() => Person)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'member_id', type: 'uuid', nullable: true })
  memberId: string | null;

  @ManyToOne(() => JrsMember)
  @JoinColumn({ name: 'member_id' })
  member: JrsMember;
}
