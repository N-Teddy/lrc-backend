import { BaseEntity } from '@app/database/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { Town } from './town.entity';

@Entity('countries', { schema: 'core' })
export class Country extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string; // e.g., CM, FR, US

  @Column({ name: 'phone_code' })
  phoneCode: string; // e.g., +237

  @OneToMany(() => Town, (town) => town.country)
  towns: Town[];
}
