import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '@app/database/entities/core/person.entity';
import { AppException } from '@app/common';
import { AppErrorCode } from '@app/types';

@Injectable()
export class PersonService {
  private readonly logger = new Logger(PersonService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
  ) {}

  async findByEmail(email: string) {
    return await this.personRepo.findOne({
      where: { email },
    });
  }

  async create(
    data: Partial<Person>,
    creator: { townId: string; countryId: string },
  ) {
    if (!data.email) {
      throw AppException.badRequest(
        'Email is required',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw AppException.conflict(
        'Email already registered',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const personData = {
      ...data,
      townId: creator.townId,
      countryId: creator.countryId,
    };

    const person = this.personRepo.create(personData);
    return this.personRepo.save(person);
  }

  async findAll(options?: { townId?: string; countryId?: string }) {
    const query = this.personRepo
      .createQueryBuilder('person')
      .leftJoinAndSelect('person.town', 'town')
      .leftJoinAndSelect('person.country', 'country');

    if (options?.townId) {
      query.where('person.townId = :townId', { townId: options.townId });
    }

    if (options?.countryId) {
      query.andWhere('person.countryId = :countryId', {
        countryId: options.countryId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const person = await this.personRepo.findOne({
      where: { id },
      relations: ['town', 'country'],
    });

    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return person;
  }

  async update(id: string, data: Partial<Person>) {
    const person = await this.findOne(id);
    Object.assign(person, data);
    return this.personRepo.save(person);
  }

  async archive(id: string) {
    const person = await this.findOne(id);
    person.isArchived = true;
    return this.personRepo.save(person);
  }

  async restore(id: string) {
    const person = await this.personRepo.findOne({ where: { id } });
    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }
    person.isArchived = false;
    return this.personRepo.save(person);
  }
}
