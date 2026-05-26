import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Town } from '@app/database/entities/core/town.entity';
import { AppException } from '@app/common';
import { AppErrorCode } from '@app/types';

@Injectable()
export class TownService {
  private readonly logger = new Logger(TownService.name);

  constructor(
    @InjectRepository(Town)
    private readonly townRepo: Repository<Town>,
  ) {}

  private buildTownListQuery(
    search?: string,
    countryId?: string,
  ): SelectQueryBuilder<Town> {
    const query = this.townRepo
      .createQueryBuilder('town')
      .leftJoinAndSelect('town.country', 'country')
      .select([
        'town.id',
        'town.createdAt',
        'town.updatedAt',
        'town.createdBy',
        'town.updatedBy',
        'town.name',
        'town.countryId',
        'country.id',
        'country.name',
        'country.code',
        'country.phoneCode',
      ]);

    if (search) {
      query.where('town.name ILIKE :search', { search: `%${search}%` });
    }

    if (countryId) {
      query.andWhere('town.countryId = :countryId', { countryId });
    }

    return query;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    countryId?: string;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 10, 100);

    const [towns, total] = await this.buildTownListQuery(
      options?.search,
      options?.countryId,
    )
      .orderBy('town.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: towns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const town = await this.townRepo.findOne({
      where: { id },
      relations: ['country'],
    });

    if (!town) {
      throw AppException.notFound(
        'Town not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return town;
  }

  async findByCountry(countryId: string) {
    return await this.townRepo.find({
      where: { countryId },
      relations: ['country'],
    });
  }

  async create(dto: { name: string; countryId: string }) {
    const existing = await this.townRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw AppException.conflict(
        'Town name already exists',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const town = this.townRepo.create(dto);
    return this.townRepo.save(town);
  }

  async update(id: string, dto: { name?: string; countryId?: string }) {
    const town = await this.findOne(id);

    if (dto.name) {
      const existing = await this.townRepo.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw AppException.conflict(
          'Town name already exists',
          AppErrorCode.DB_DUPLICATE_ENTRY,
        );
      }
    }

    Object.assign(town, dto);
    return this.townRepo.save(town);
  }

  async delete(id: string) {
    const town = await this.findOne(id);
    return this.townRepo.remove(town);
  }
}
