import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentreActivity } from '@app/database/entities/centre/centre-activity.entity';
import { CentreAttendance } from '@app/database/entities/centre/centre-attendance.entity';
import { Person } from '@app/database/entities/core/person.entity';
import { Town } from '@app/database/entities/core/town.entity';
import { Country } from '@app/database/entities/core/country.entity';
import { ActivityStatus, ActivityScope, AppRole } from '@app/types';
import { AppException, NotificationService } from '@app/common';
import { AppErrorCode } from '@app/types';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityFilterDto,
  MarkAttendanceDto,
  AttendanceFilterDto,
} from './dto';
import { ActivityEligibilityService } from './eligibility/activity-eligibility.service';
import type { UserPayload } from '@app/types';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(CentreActivity)
    private readonly activityRepo: Repository<CentreActivity>,
    @InjectRepository(CentreAttendance)
    private readonly attendanceRepo: Repository<CentreAttendance>,
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(Town)
    private readonly townRepo: Repository<Town>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    private readonly notificationService: NotificationService,
    private readonly eligibilityService: ActivityEligibilityService,
  ) {}

  async create(dto: CreateActivityDto, requestingUser: UserPayload) {
    const isIntendant = this.isIntendant(requestingUser);
    const scope = dto.scope || ActivityScope.TOWN;

    let townId: string | null = null;
    const countryId = requestingUser.countryId;

    if (scope === ActivityScope.COUNTRY) {
      if (!isIntendant) {
        throw AppException.forbidden(
          'Only Intendant can create country-level activities',
          AppErrorCode.AUTH_FORBIDDEN,
        );
      }

      const userTown = await this.townRepo.findOne({
        where: { id: requestingUser.townId },
      });

      if (!userTown?.isCentreRenewal) {
        throw AppException.forbidden(
          'Country-level activities can only be created from Centre de Renouvellement',
          AppErrorCode.AUTH_FORBIDDEN,
        );
      }

      townId = null;
    } else {
      townId = requestingUser.townId;
    }

    const activityDate = new Date(dto.startDate);
    let endDate: Date | null = dto.endDate ? new Date(dto.endDate) : null;

    if (!endDate) {
      endDate = activityDate;
    }

    const activity = this.activityRepo.create({
      title: dto.title,
      description: dto.description,
      activityType: dto.activityType,
      townId,
      countryId,
      location: dto.location,
      startDate: activityDate,
      endDate,
      isConference: dto.activityType === 'CONFERENCE',
      status: ActivityStatus.PROGRAMMED,
      scope,
    });

    const savedActivity = await this.activityRepo.save(activity);

    await this.notifyActivityCreated(savedActivity, requestingUser);

    return this.findOne(savedActivity.id, requestingUser);
  }

  async findAll(filters: ActivityFilterDto, requestingUser: UserPayload) {
    const query = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.town', 'town')
      .orderBy('activity.startDate', 'DESC');

    query.where(
      '(activity.scope = :countryScope AND activity.countryId = :countryId) OR (activity.scope = :townScope AND activity.townId = :townId)',
      {
        countryScope: ActivityScope.COUNTRY,
        townScope: ActivityScope.TOWN,
        countryId: requestingUser.countryId,
        townId: requestingUser.townId,
      },
    );

    if (filters.activityType) {
      query.andWhere('activity.activityType = :activityType', {
        activityType: filters.activityType,
      });
    }

    if (filters.scope) {
      query.andWhere('activity.scope = :scope', { scope: filters.scope });
    }

    if (filters.isConference !== undefined) {
      query.andWhere('activity.isConference = :isConference', {
        isConference: filters.isConference,
      });
    }

    if (filters.startDateFrom) {
      query.andWhere('activity.startDate >= :startDateFrom', {
        startDateFrom: filters.startDateFrom,
      });
    }

    if (filters.startDateTo) {
      query.andWhere('activity.startDate <= :startDateTo', {
        startDateTo: filters.startDateTo,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [activities, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, requestingUser: UserPayload) {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['town'],
    });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canViewActivity(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have access to this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    const attendanceCount = await this.attendanceRepo.count({
      where: { activityId: activity.id },
    });

    return { ...activity, attendanceCount };
  }

  async update(
    id: string,
    dto: UpdateActivityDto,
    requestingUser: UserPayload,
  ) {
    const activity = await this.activityRepo.findOne({ where: { id } });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canModifyActivity(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have permission to update this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    if (dto.title !== undefined) activity.title = dto.title;
    if (dto.description !== undefined) activity.description = dto.description;
    if (dto.location !== undefined) activity.location = dto.location;
    if (dto.startDate !== undefined)
      activity.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) activity.endDate = new Date(dto.endDate);

    const savedActivity = await this.activityRepo.save(activity);

    return this.findOne(savedActivity.id, requestingUser);
  }

  async cancel(id: string, requestingUser: UserPayload) {
    const activity = await this.activityRepo.findOne({ where: { id } });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canModifyActivity(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have permission to cancel this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    activity.status = ActivityStatus.CANCELLED;
    await this.activityRepo.save(activity);

    await this.notifyActivityCancelled(activity, requestingUser);

    return this.findOne(activity.id, requestingUser);
  }

  async archive(id: string, requestingUser: UserPayload) {
    const activity = await this.activityRepo.findOne({ where: { id } });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.isIntendant(requestingUser)) {
      throw AppException.forbidden(
        'Only Intendant can archive activities',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    const hasAttendance = await this.attendanceRepo.count({
      where: { activityId: activity.id },
    });

    if (hasAttendance) {
      throw AppException.badRequest(
        'Cannot archive activity with attendance records',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    await this.activityRepo.softDelete(activity.id);

    await this.notifyActivityArchived(activity, requestingUser);

    return { success: true };
  }

  async lockActivity(id: string, requestingUser: UserPayload) {
    const activity = await this.activityRepo.findOne({ where: { id } });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canModifyActivity(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have permission to lock this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    activity.isLocked = true;
    activity.lockedAt = new Date();
    activity.lockedById = requestingUser.sub;
    await this.activityRepo.save(activity);

    await this.notifyActivityLocked(activity, requestingUser);

    return this.findOne(activity.id, requestingUser);
  }

  async getAttendance(
    activityId: string,
    filters: AttendanceFilterDto,
    requestingUser: UserPayload,
  ) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canViewActivity(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have access to this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    const query = this.attendanceRepo
      .createQueryBuilder('attendance')
      .innerJoinAndSelect('attendance.person', 'person')
      .innerJoinAndSelect('person.town', 'town')
      .where('attendance.activityId = :activityId', { activityId })
      .orderBy('person.fullName', 'ASC');

    if (filters.townId) {
      query.andWhere('person.townId = :townId', { townId: filters.townId });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [attendance, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: attendance,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAttendance(
    activityId: string,
    dto: MarkAttendanceDto,
    requestingUser: UserPayload,
  ) {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canModifyAttendance(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have permission to mark attendance for this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    const person = await this.personRepo.findOne({
      where: { id: dto.personId },
    });
    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const attendanceCount = await this.attendanceRepo.count({
      where: { activityId },
    });
    const isLockedWithAttendance = activity.isLocked && attendanceCount > 0;

    const existingAttendance = await this.attendanceRepo.findOne({
      where: { activityId: activity.id, personId: dto.personId },
    });

    if (existingAttendance) {
      return existingAttendance;
    }

    if (isLockedWithAttendance) {
      await this.notifyAttendanceAddedToLocked(
        activity,
        person,
        requestingUser,
      );
    }

    // Check eligibility before marking attendance
    const isEligible = await this.eligibilityService.isEligibleForActivity(
      person,
      activity.targetGroups ?? undefined
    );

    if (!isEligible) {
      throw AppException.forbidden(
        'Person is not eligible to attend this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    const attendance = this.attendanceRepo.create({
      activityId: activity.id,
      personId: dto.personId,
    });

    const savedAttendance = await this.attendanceRepo.save(attendance);

    return savedAttendance;
  }

  async removeAttendance(
    activityId: string,
    personId: string,
    requestingUser: UserPayload,
  ): Promise<{ success: boolean }> {
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw AppException.notFound(
        'Activity not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    if (!this.canModifyAttendance(activity, requestingUser)) {
      throw AppException.forbidden(
        'You do not have permission to remove attendance for this activity',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    if (activity.isLocked) {
      throw AppException.badRequest(
        'Cannot remove attendance from locked activity',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    await this.attendanceRepo.delete({ activityId, personId });

    return { success: true };
  }

  async getConferences(countryId: string) {
    return this.activityRepo.find({
      where: {
        countryId,
        scope: ActivityScope.COUNTRY,
        isConference: true,
      },
      order: { startDate: 'DESC' },
    });
  }

  private isIntendant(user: UserPayload): boolean {
    return user.profiles?.some(
      (p) =>
        typeof p.app === 'string' &&
        p.app === 'CENTRE' &&
        p.roles?.includes(AppRole.INTENDANT),
    );
  }

  private canViewActivity(
    activity: CentreActivity,
    user: UserPayload,
  ): boolean {
    if (activity.scope === ActivityScope.COUNTRY) {
      return activity.countryId === user.countryId;
    }
    return activity.townId === user.townId || this.isIntendant(user);
  }

  private canModifyActivity(
    activity: CentreActivity,
    user: UserPayload,
  ): boolean {
    if (this.isIntendant(user)) return true;
    if (
      activity.scope === ActivityScope.TOWN &&
      activity.townId === user.townId
    )
      return true;
    return false;
  }

  private canModifyAttendance(
    activity: CentreActivity,
    user: UserPayload,
  ): boolean {
    if (this.isIntendant(user)) return true;
    if (
      activity.scope === ActivityScope.TOWN &&
      activity.townId === user.townId
    )
      return true;
    return false;
  }

  private async notifyActivityCreated(
    activity: CentreActivity,
    user: UserPayload,
  ) {
    this.logger.log(`Activity ${activity.id} created: ${activity.title}`);
  }

  private async notifyActivityCancelled(
    activity: CentreActivity,
    _user: UserPayload,
  ) {
    this.logger.log(`Activity ${activity.id} cancelled: ${activity.title}`);
  }

  private async notifyActivityArchived(
    activity: CentreActivity,
    _user: UserPayload,
  ) {
    this.logger.log(`Activity ${activity.id} archived: ${activity.title}`);
  }

  private async notifyActivityLocked(
    activity: CentreActivity,
    _user: UserPayload,
  ) {
    this.logger.log(`Activity ${activity.id} locked: ${activity.title}`);
  }

  private async notifyAttendanceAddedToLocked(
    activity: CentreActivity,
    person: Person,
    _user: UserPayload,
  ) {
    this.logger.log(
      `Attendance added to locked activity ${activity.id} for ${person.fullName}`,
    );
  }
}