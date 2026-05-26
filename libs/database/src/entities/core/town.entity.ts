import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '@app/database/base.entity';
import { Country } from './country.entity';

@Entity('towns', { schema: 'core' })
@Unique(['name', 'countryId'])
export class Town extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'country_id' })
  countryId: string;

  @Column({ name: 'is_centre_renewal', default: false })
  isCentreRenewal: boolean;

  @ManyToOne(() => Country, (country) => country.towns)
  @JoinColumn({ name: 'country_id' })
  country: Country;
}
