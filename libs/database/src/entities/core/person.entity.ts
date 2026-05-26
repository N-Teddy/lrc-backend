import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Gender, PersonStatus } from '@app/types';
import { Country } from './country.entity';
import { User } from './user.entity';
import { BaseEntity } from '@app/database/base.entity';
import { Town } from './town.entity';
import { GradeLevel } from './grade-level.entity';

@Entity('persons', { schema: 'core' })
@Index(['email'])
@Index(['townId'])
@Index(['countryId'])
export class Person extends BaseEntity {
  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
  })
  gender: Gender;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  picture: string;

  @Column({ name: 'picture_public_id', nullable: true })
  picturePublicId: string;

  @Column({
    type: 'enum',
    enum: PersonStatus,
    default: PersonStatus.ALIVE,
  })
  status: PersonStatus;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'grade_level_id', type: 'uuid', nullable: true })
  gradeLevelId: string | null;

  @ManyToOne(() => GradeLevel, { nullable: true })
  @JoinColumn({ name: 'grade_level_id' })
  gradeLevel: GradeLevel;

  // Geographic links
  @Column({ name: 'town_id', type: 'uuid', nullable: true })
  townId: string | null;

  @ManyToOne(() => Town)
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @Column({ name: 'country_id', type: 'uuid', nullable: true })
  countryId: string | null;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToOne(() => User, (user) => user.person)
  user: User;
}
