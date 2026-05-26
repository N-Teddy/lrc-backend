import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../base.entity';
import { AppProfile } from './app-profile.entity';

@Entity('app_roles', { schema: 'core' })
@Unique(['appProfileId', 'roleName'])
@Index(['appProfileId'])
export class AppRole extends BaseEntity {
  @Column({ name: 'app_profile_id' })
  appProfileId: string;

  @ManyToOne(() => AppProfile, (profile) => profile.roles)
  @JoinColumn({ name: 'app_profile_id' })
  appProfile: AppProfile;

  @Column({ name: 'role_name' })
  roleName: string; // e.g., JRS_ADMIN, FINANCE_VIEWER
}
