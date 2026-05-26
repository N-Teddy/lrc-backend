import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Person } from '../core/person.entity';
import { MemberStatus } from '@app/types';
import { BaseEntity } from '@app/database/base.entity';

@Entity('members', { schema: 'jrs' })
export class JrsMember extends BaseEntity {
  @Column({ name: 'person_id', type: 'uuid', unique: true })
  personId: string;

  @ManyToOne(() => Person)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'join_date', type: 'date' })
  joinDate: Date;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE,
  })
  status: MemberStatus;

  @Column({ name: 'is_pc', default: false })
  isPc: boolean;

  @Column({ name: 'is_ap', default: false })
  isAp: boolean;

  @Column({ name: 'has_system_access', default: false })
  hasSystemAccess: boolean;
}
