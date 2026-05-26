import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import { AppRole } from '@app/database/entities/core/app-role.entity';
import { AppException } from '@app/common';
import { AppErrorCode, AppCode } from '@app/types';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(AppProfile)
    private readonly profileRepo: Repository<AppProfile>,
    @InjectRepository(AppRole)
    private readonly roleRepo: Repository<AppRole>,
  ) {}

  private buildProfileListQuery(
    appCode?: AppCode,
    role?: string,
  ): SelectQueryBuilder<AppProfile> {
    const query = this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('user.person', 'person')
      .leftJoinAndSelect('profile.roles', 'roles')
      .select([
        'profile.id',
        'profile.createdAt',
        'profile.updatedAt',
        'profile.createdBy',
        'profile.updatedBy',
        'profile.userId',
        'profile.appCode',
        'profile.isActive',
        'user.id',
        'user.personId',
        'user.isEmailVerified',
        'user.isWhatsAppVerified',
        'user.lastLogin',
        'person.id',
        'person.fullName',
        'person.email',
        'person.phone',
        'person.gender',
        'person.status',
        'person.isArchived',
        'person.townId',
        'person.countryId',
        'roles.id',
        'roles.roleName',
      ]);

    if (appCode) {
      query.where('profile.appCode = :appCode', { appCode });
    }

    if (role) {
      query.andWhere('roles.roleName ILIKE :role', { role: `%${role}%` });
    }

    return query;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    appCode?: AppCode;
    role?: string;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 10, 100);

    const [profiles, total] = await this.buildProfileListQuery(
      options?.appCode,
      options?.role,
    )
      .orderBy('profile.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUser(userId: string) {
    return await this.profileRepo.find({
      where: { userId, isActive: true },
      relations: ['roles'],
    });
  }

  async findOne(id: string) {
    const profile = await this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('user.person', 'person')
      .leftJoinAndSelect('profile.roles', 'roles')
      .select([
        'profile.id',
        'profile.createdAt',
        'profile.updatedAt',
        'profile.createdBy',
        'profile.updatedBy',
        'profile.userId',
        'profile.appCode',
        'profile.isActive',
        'user.id',
        'user.personId',
        'user.isEmailVerified',
        'user.isWhatsAppVerified',
        'user.lastLogin',
        'person.id',
        'person.fullName',
        'person.email',
        'person.phone',
        'person.gender',
        'person.status',
        'person.isArchived',
        'person.townId',
        'person.countryId',
        'roles.id',
        'roles.roleName',
      ])
      .where('profile.id = :id', { id })
      .getOne();

    if (!profile) {
      throw AppException.notFound(
        'Profile not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return profile;
  }

  async create(dto: { userId: string; appCode: AppCode; roles: string[] }) {
    const existing = await this.profileRepo.findOne({
      where: { userId: dto.userId, appCode: dto.appCode },
    });

    if (existing) {
      throw AppException.conflict(
        'Profile already exists for this app',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const profile = this.profileRepo.create({
      userId: dto.userId,
      appCode: dto.appCode,
      isActive: true,
    });

    const saved = await this.profileRepo.save(profile);

    // Batch save roles using array for single query
    const roles = dto.roles.map((roleName) =>
      this.roleRepo.create({
        appProfileId: saved.id,
        roleName,
      }),
    );
    await this.roleRepo.save(roles);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: { isActive?: boolean }) {
    const profile = await this.findOne(id);
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  async delete(id: string) {
    const profile = await this.findOne(id);
    await this.roleRepo.delete({ appProfileId: id });
    return this.profileRepo.remove(profile);
  }

  async assignRole(profileId: string, roleName: string) {
    const profile = await this.findOne(profileId);
    // Check if role already exists
    const existingRole = await this.roleRepo.findOne({
      where: { appProfileId: profile.id, roleName },
    });
    if (existingRole) {
      return this.findOne(profileId);
    }
    // Batch save for consistency
    await this.roleRepo.save([
      this.roleRepo.create({
        appProfileId: profile.id,
        roleName,
      }),
    ]);
    return this.findOne(profileId);
  }

  async removeRole(profileId: string, roleName: string) {
    await this.roleRepo.delete({
      appProfileId: profileId,
      roleName,
    });
    return true;
  }
}
