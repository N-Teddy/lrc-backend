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

  async findAll() {
    return await this.personRepo.find({
      relations: ['town', 'country'],
      where: { isArchived: false },
    });
  }

  async findOne(id: string) {
    const person = await this.personRepo.findOne({
      where: { id },
      relations: ['town', 'country', 'user'],
    });

    if (!person) {
      throw new AppException(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return person;
  }

  async findByEmail(email: string) {
    return await this.personRepo.findOne({ where: { email } });
  }

  async create(data: Partial<Person>) {
    if (!data.email) {
      throw new AppException(
        'Email is required',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new AppException(
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
}
