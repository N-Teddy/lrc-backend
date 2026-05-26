import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@app/database/base.entity';
import { GradeLevel } from './grade-level.entity';

@Entity('grade_categories', { schema: 'core' })
export class GradeCategory extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => GradeLevel, (level) => level.category)
  levels: GradeLevel[];
}
