import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Person } from './person.entity';
import { AppProfile } from './app-profile.entity';
import { BaseEntity } from '@app/database/base.entity';

@Entity('users', { schema: 'core' })
@Index(['personId'])
export class User extends BaseEntity {
  @Column({ name: 'person_id' })
  personId: string;

  @OneToOne(() => Person, (person) => person.user)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash: string | null;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_whatsapp_verified', default: false })
  isWhatsAppVerified: boolean;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @Column({ name: 'password_reset_token', type: 'text', nullable: true })
  passwordResetToken: string | null;

  @Column({
    name: 'password_reset_expires',
    type: 'timestamptz',
    nullable: true,
  })
  passwordResetExpires: Date | null;

  @Column({ name: 'is_first_login', default: true })
  isFirstLogin: boolean;

  @Column({ name: 'invite_token', type: 'text', nullable: true })
  inviteToken: string | null;

  @Column({ name: 'invite_token_expires', type: 'timestamptz', nullable: true })
  inviteTokenExpires: Date | null;

  @OneToMany(() => AppProfile, (profile) => profile.user)
  appProfiles: AppProfile[];
}
