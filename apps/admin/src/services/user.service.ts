import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '@app/database/entities/core/user.entity';
import { AppException } from '@app/common';
import { AppErrorCode, AppCode } from '@app/types';
import { PasswordService } from '@app/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  private buildUserListQuery(
    search?: string,
    appCode?: AppCode,
    role?: string,
  ): SelectQueryBuilder<User> {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.person', 'person')
      .leftJoinAndSelect('person.town', 'town')
      .leftJoinAndSelect('person.country', 'country')
      .select([
        'user.id',
        'user.createdAt',
        'user.updatedAt',
        'user.createdBy',
        'user.updatedBy',
        'user.personId',
        'user.isEmailVerified',
        'user.isWhatsAppVerified',
        'user.lastLogin',
        'person.id',
        'person.fullName',
        'person.email',
        'person.phone',
        'person.gender',
        'person.dob',
        'person.picture',
        'person.status',
        'person.isArchived',
        'person.gradeLevel',
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

    if (appCode) {
      query
        .leftJoin('user.appProfiles', 'appProfiles')
        .andWhere('appProfiles.appCode = :appCode', { appCode });
    }

    if (role) {
      query
        .leftJoin('appProfiles', 'ap', 'ap.userId = user.id')
        .leftJoin('ap.roles', 'r')
        .andWhere('r.roleName ILIKE :role', { role: `%${role}%` });
    }

    return query;
  }

  private buildUserDetailQuery(id: string): SelectQueryBuilder<User> {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.person', 'person')
      .leftJoinAndSelect('person.town', 'town')
      .leftJoinAndSelect('person.country', 'country')
      .leftJoinAndSelect('user.appProfiles', 'appProfiles')
      .leftJoinAndSelect('appProfiles.roles', 'roles')
      .select([
        'user.id',
        'user.createdAt',
        'user.updatedAt',
        'user.createdBy',
        'user.updatedBy',
        'user.personId',
        'user.isEmailVerified',
        'user.isWhatsAppVerified',
        'user.lastLogin',
        'person.id',
        'person.fullName',
        'person.email',
        'person.phone',
        'person.gender',
        'person.dob',
        'person.picture',
        'person.status',
        'person.isArchived',
        'person.gradeLevel',
        'person.townId',
        'person.countryId',
        'town.id',
        'town.name',
        'town.countryId',
        'country.id',
        'country.name',
        'country.code',
        'country.phoneCode',
        'appProfiles.id',
        'appProfiles.appCode',
        'appProfiles.isActive',
        'roles.id',
        'roles.roleName',
      ])
      .where('user.id = :id', { id });
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    appCode?: AppCode;
    role?: string;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 10, 100);

    const [users, total] = await this.buildUserListQuery(
      options?.search,
      options?.appCode,
      options?.role,
    )
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.buildUserDetailQuery(id).getOne();

    if (!user) {
      throw AppException.notFound(
        'User not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return user;
  }

  async findByPersonId(personId: string) {
    const user = await this.userRepo.findOne({
      where: { personId },
      relations: ['person', 'appProfiles', 'appProfiles.roles'],
    });
    return user;
  }

  async create(dto: { personId: string; password: string }) {
    const existing = await this.findByPersonId(dto.personId);
    if (existing) {
      throw AppException.conflict(
        'User already exists for this person',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = this.userRepo.create({
      personId: dto.personId,
      passwordHash,
      isEmailVerified: false,
      isWhatsAppVerified: false,
    });

    return this.userRepo.save(user);
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.findOne(id);
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async delete(id: string) {
    const user = await this.findOne(id);
    return this.userRepo.remove(user);
  }
}
