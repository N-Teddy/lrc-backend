import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

  private buildPersonListQuery(
    search?: string,
    townId?: string,
    countryId?: string,
    isArchived?: boolean,
  ): SelectQueryBuilder<Person> {
    const query = this.personRepo
      .createQueryBuilder('person')
      .leftJoinAndSelect('person.town', 'town')
      .leftJoinAndSelect('person.country', 'country')
      .select([
        'person.id',
        'person.createdAt',
        'person.updatedAt',
        'person.createdBy',
        'person.updatedBy',
        'person.fullName',
        'person.email',
        'person.phone',
        'person.gender',
        'person.dob',
        'person.picture',
        'person.status',
        'person.isArchived',
        'person.gradeLevelId',
        'person.townId',
        'person.countryId',
        'town.id',
        'town.name',
        'town.countryId',
        'country.id',
        'country.name',
        'country.code',
        'country.phoneCode',
      ]);

    if (search) {
      query.where(
        '(person.fullName ILIKE :search OR person.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (townId) {
      query.andWhere('person.townId = :townId', { townId });
    }

    if (countryId) {
      query.andWhere('person.countryId = :countryId', { countryId });
    }

    if (typeof isArchived === 'boolean') {
      query.andWhere('person.isArchived = :isArchived', { isArchived });
    }

    return query;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    townId?: string;
    countryId?: string;
    isArchived?: boolean;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 10, 100);

    const [persons, total] = await this.buildPersonListQuery(
      options?.search,
      options?.townId,
      options?.countryId,
      options?.isArchived,
    )
      .orderBy('person.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: persons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const person = await this.buildPersonListQuery()
      .where('person.id = :id', { id })
      .getOne();

    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return person;
  }

  async findByEmail(email: string) {
    return await this.personRepo.findOne({
      where: { email },
    });
  }

  async create(data: Partial<Person>) {
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

    const person = this.personRepo.create(data);
    return this.personRepo.save(person);
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

  async delete(id: string) {
    const person = await this.findOne(id);
    return this.personRepo.remove(person);
  }
}
