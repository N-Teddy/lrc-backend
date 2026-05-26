import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '@app/database/base.entity';
import { Person } from '../core/person.entity';
import { JeunesGroup } from './jeunes-group.entity';

@Entity('jeunes_members', { schema: 'jeunes' })
@Unique(['personId'])
@Index(['jeunesGroupId'])
export class JeunesMember extends BaseEntity {
  @Column({ name: 'person_id', type: 'uuid' })
  personId: string;

  @ManyToOne(() => Person)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'jeunes_group_id', type: 'uuid' })
  jeunesGroupId: string;

  @ManyToOne(() => JeunesGroup)
  @JoinColumn({ name: 'jeunes_group_id' })
  jeunesGroup: JeunesGroup;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;
}
