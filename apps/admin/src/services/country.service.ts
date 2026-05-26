import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Country } from '@app/database/entities/core/country.entity';
import { AppException } from '@app/common';
import { AppErrorCode } from '@app/types';

@Injectable()
export class CountryService {
  private readonly logger = new Logger(CountryService.name);

  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
  ) {}

  private buildCountryListQuery(search?: string): SelectQueryBuilder<Country> {
    const query = this.countryRepo
      .createQueryBuilder('country')
      .select([
        'country.id',
        'country.createdAt',
        'country.updatedAt',
        'country.createdBy',
        'country.updatedBy',
        'country.name',
        'country.code',
        'country.phoneCode',
      ]);

    if (search) {
      query.where('country.name ILIKE :search', { search: `%${search}%` });
    }

    return query;
  }

  async findAll(options?: { page?: number; limit?: number; search?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 10, 100);

    const [countries, total] = await this.buildCountryListQuery(options?.search)
      .orderBy('country.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: countries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const country = await this.countryRepo.findOne({
      where: { id },
      relations: ['towns'],
    });

    if (!country) {
      throw AppException.notFound(
        'Country not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return country;
  }

  async findByCode(code: string) {
    return await this.countryRepo.findOne({
      where: { code },
      relations: ['towns'],
    });
  }

  async create(dto: { name: string; code: string; phoneCode: string }) {
    const existingCode = await this.findByCode(dto.code);
    if (existingCode) {
      throw AppException.conflict(
        'Country code already exists',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const existingName = await this.countryRepo.findOne({
      where: { name: dto.name },
    });
    if (existingName) {
      throw AppException.conflict(
        'Country name already exists',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const country = this.countryRepo.create(dto);
    return this.countryRepo.save(country);
  }

  async update(
    id: string,
    dto: { name?: string; code?: string; phoneCode?: string },
  ) {
    const country = await this.findOne(id);

    if (dto.code) {
      const existing = await this.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw AppException.conflict(
          'Country code already exists',
          AppErrorCode.DB_DUPLICATE_ENTRY,
        );
      }
    }

    if (dto.name) {
      const existing = await this.countryRepo.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw AppException.conflict(
          'Country name already exists',
          AppErrorCode.DB_DUPLICATE_ENTRY,
        );
      }
    }

    Object.assign(country, dto);
    return this.countryRepo.save(country);
  }

  async delete(id: string) {
    const country = await this.findOne(id);
    return this.countryRepo.remove(country);
  }
}
