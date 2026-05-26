import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../base.entity';

@Entity('activity_eligibility_rules', { schema: 'core' })
@Unique(['activityType'])
export class ActivityEligibilityRule extends BaseEntity {
  @Column()
  activityType: string;

  @Column({ name: 'allowed_grade_category', nullable: true })
  allowedGradeCategory: string;

  @Column({
    name: 'allowed_grade_level_ids',
    type: 'uuid',
    array: true,
    nullable: true,
  })
  allowedGradeLevelIds: string[];

  @Column({
    name: 'allowed_jeunes_group_names',
    type: 'text',
    array: true,
    nullable: true,
  })
  allowedJeunesGroupNames: string[];

  @Column({ name: 'requires_jrs', default: false })
  requiresJrs: boolean;

  @Column({ name: 'min_age', type: 'integer', nullable: true })
  minAge: number;

  @Column({ name: 'max_age', type: 'integer', nullable: true })
  maxAge: number;
}
