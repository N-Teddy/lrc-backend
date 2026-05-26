import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { AppRole } from './app-role.entity';
import { AppCode } from '@app/types';
import { BaseEntity } from '@app/database/base.entity';
import { User } from './user.entity';

@Entity('app_profiles', { schema: 'core' })
@Unique(['userId', 'appCode'])
@Index(['userId'])
@Index(['appCode'])
export class AppProfile extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.appProfiles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: AppCode,
    name: 'app_code',
  })
  appCode: AppCode;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => AppRole, (role) => role.appProfile)
  roles: AppRole[];
}
