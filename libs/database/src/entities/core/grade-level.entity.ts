import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '@app/database/base.entity';
import { GradeCategory } from './grade-category.entity';

@Entity('grade_levels', { schema: 'core' })
@Unique(['categoryId', 'name'])
@Index(['categoryId', 'displayOrder'])
export class GradeLevel extends BaseEntity {
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => GradeCategory, (category) => category.levels)
  @JoinColumn({ name: 'category_id' })
  category: GradeCategory;

  @Column()
  name: string;

  @Column({ name: 'display_order', type: 'integer' })
  displayOrder: number;

  @Column({ name: 'min_aspect', type: 'integer', nullable: true })
  minAspect: number;
}
