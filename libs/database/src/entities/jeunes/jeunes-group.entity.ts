import { Entity, Column, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '@app/database/base.entity';
import { JeunesMember } from './jeunes-member.entity';

@Entity('jeunes_groups', { schema: 'jeunes' })
@Unique(['name'])
export class JeunesGroup extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'min_age', type: 'integer' })
  minAge: number;

  @Column({ name: 'max_age', type: 'integer' })
  maxAge: number;

  @Column({ name: 'display_order', type: 'integer' })
  displayOrder: number;

  @OneToMany(() => JeunesMember, (member) => member.jeunesGroup)
  members: JeunesMember[];
}
