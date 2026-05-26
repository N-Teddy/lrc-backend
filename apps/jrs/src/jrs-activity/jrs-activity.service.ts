import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JrsActivity } from '@app/database/entities/jrs/jrs-activity.entity';
import { JrsAttendance } from '@app/database/entities/jrs/jrs-attendance.entity';
import { JrsMember } from '@app/database/entities/jrs/jrs-member.entity';
import { Person } from '@app/database/entities/core/person.entity';
import { Town } from '@app/database/entities/core/town.entity';
import { Country } from '@app/database/entities/core/country.entity';
import {
  ActivityType,
  ActivityStatus,
  ActivityScope,
  NotificationType,
  NotificationChannel,
  AppRole,
  AppCode,
} from '@app/types';
import { AppException, NotificationService } from '@app/common';
import { AppErrorCode } from '@app/types';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityFilterDto,
  MarkAttendanceDto,
  AttendanceFilterDto,
} from './dto';
import type { UserPayload } from '@app/types';

@Injectable()
export class JrsActivityService {
  private readonly logger = new Logger(JrsActivityService.name);

  constructor(
    @InjectRepository(JrsActivity)
    private readonly activityRepo: Repository<JrsActivity>,
    @InjectRepository(JrsAttendance)
    private readonly attendanceRepo: Repository<JrsAttendance>,
    @InjectRepository(JrsMember)
    private readonly memberRepo: Repository<JrsMember>,
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(Town)
    private readonly townRepo: Repository<Town>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateActivityDto, requestingUser: UserPayload) {
    let townId = dto.townId;
    let countryId: string | undefined = dto.countryId;
    const activityDate = new Date(dto.startDate);
    let endDate: Date | null = dto.endDate ? new Date(dto.endDate) : null;
    const scope = dto.scope || ActivityScope.TOWN;

    // Get town for COUNTRY scope activities
    if (scope === ActivityScope.COUNTRY && !countryId && townId) {
      const town = await this.townRepo.findOne({
        where: { id: townId },
        relations: ['country'],
      });
      countryId = town?.countryId;
    }

    // Determine town for CONFERENCE/SEMAINE activities
    if (
      (dto.activityType === ActivityType.CONFERENCE ||
        dto.activityType === ActivityType.SEMAINE) &&
      !townId
    ) {
      const centreTown = await this.townRepo.findOne({
        where: { isCentreRenewal: true },
      });
      if (centreTown) {
        townId = centreTown.id;
      }
    }

    // Auto-set endDate for single-day activities if not provided
    if (
      !endDate &&
      (dto.activityType === ActivityType.MONTHLY_MEETING ||
        dto.activityType === ActivityType.SERVICE)
    ) {
      endDate = activityDate;
    }

    if (!townId && scope === ActivityScope.TOWN) {
      throw AppException.badRequest(
        'Town ID is required for TOWN scope activities',
        AppErrorCode.VALIDATION_FAILED,
      );
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
      isConference: dto.isConference ?? false,
      status: ActivityStatus.PROGRAMMED,
      scope,
    });

    const savedActivity = await this.activityRepo.save(activity);

    await this.notifyActivityCreated(savedActivity, requestingUser);

    return this.findOne(savedActivity.id, requestingUser);
  }

  async findAll(filters: ActivityFilterDto, requestingUser: UserPayload) {
    void requestingUser;
    const query = this.activityRepo
      .createQueryBuilder('activity')
      .innerJoinAndSelect('activity.town', 'town')
      .orderBy('activity.startDate', 'DESC');

    if (filters.activityType) {
      query.andWhere('activity.activityType = :activityType', {
        activityType: filters.activityType,
      });
    }

    if (filters.townId) {
      query.andWhere('activity.townId = :townId', { townId: filters.townId });
    }

    if (filters.status) {
      query.andWhere('activity.status = :status', { status: filters.status });
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

    const activitiesWithAttendance = await this.activityRepo
      .createQueryBuilder('activity')
      .select([
        'activity.id',
        'activity.title',
        'activity.description',
        'activity.activityType',
        'activity.townId',
        'activity.countryId',
        'activity.location',
        'activity.startDate',
        'activity.endDate',
        'activity.isConference',
        'activity.status',
        'activity.scope',
        'activity.isLocked',
        'activity.lockedAt',
        'activity.lockedById',
        'activity.createdAt',
        'activity.updatedAt',
      ])
      .leftJoin('activity.attendanceRecords', 'attendance')
      .addSelect('COUNT(attendance.id)', 'attendanceCount')
      .where('activity.id IN (:...ids)', {
        ids: activities.map((a) => a.id),
      })
      .groupBy('activity.id')
      .getRawMany();

    return {
      items: activitiesWithAttendance,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, requestingUser: UserPayload) {
    void requestingUser;
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

    if (dto.title !== undefined) activity.title = dto.title;
    if (dto.description !== undefined) activity.description = dto.description;
    if (dto.townId !== undefined) activity.townId = dto.townId;
    if (dto.location !== undefined) activity.location = dto.location;
    if (dto.startDate !== undefined)
      activity.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) activity.endDate = new Date(dto.endDate);
    if (dto.isConference !== undefined)
      activity.isConference = dto.isConference;
    if (dto.status !== undefined) activity.status = dto.status;

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

    const hasAttendance =
      (await this.attendanceRepo.count({
        where: { activityId: activity.id },
      })) > 0;
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
    void requestingUser;
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

    const hasApRole = requestingUser.profiles?.some(
      (p) =>
        typeof p.app === 'string' &&
        p.app === AppCode.JRS &&
        p.roles?.some((r) => r === (AppRole.JRS_AP as string)),
    );

    if (isLockedWithAttendance && !hasApRole) {
      throw AppException.forbidden(
        'Only AP can add attendance to a locked activity with existing records',
        AppErrorCode.AUTH_FORBIDDEN,
      );
    }

    // Notify PCs/APs if AP adds to locked activity
    if (isLockedWithAttendance && hasApRole) {
      await this.notifyAttendanceAddedToLocked(
        activity,
        person,
        requestingUser,
      );
    }

    // Check if attendance already exists for this person
    const existingAttendance = await this.attendanceRepo.findOne({
      where: { activityId: activity.id, personId: dto.personId },
    });

    if (existingAttendance) {
      return existingAttendance;
    }

    // Get member if person is a JRS member
    const member = await this.memberRepo.findOne({
      where: { personId: dto.personId },
    });

    const attendance = this.attendanceRepo.create({
      activityId: activity.id,
      personId: dto.personId,
      memberId: member?.id || dto.memberId || null,
    });

    const savedAttendance = await this.attendanceRepo.save(attendance);

    return savedAttendance;
  }

  async removeAttendance(
    activityId: string,
    personId: string,
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

    if (activity.isLocked) {
      throw AppException.badRequest(
        'Cannot remove attendance from locked activity',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    await this.attendanceRepo.delete({ activityId, personId });

    return { success: true };
  }

  private async notifyActivityCreated(
    activity: JrsActivity,
    user: UserPayload,
  ) {
    void user;
    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'person')
      .where('member.status = :status', { status: 'ACTIVE' })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'New Activity Created',
          body: `Activity "${activity.title}" has been scheduled`,
          data: { activityId: activity.id },
        },
        {
          type: NotificationType.JRS_ACTIVITY_CREATED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }

  private async notifyActivityCancelled(
    activity: JrsActivity,
    _user: UserPayload,
  ) {
    void _user;
    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'person')
      .where('member.status = :status', { status: 'ACTIVE' })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'Activity Cancelled',
          body: `Activity "${activity.title}" has been cancelled`,
          data: { activityId: activity.id },
        },
        {
          type: NotificationType.JRS_ACTIVITY_CANCELLED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }

  private async notifyActivityArchived(
    activity: JrsActivity,
    _user: UserPayload,
  ) {
    void _user;
    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'person')
      .where('member.status = :status', { status: 'ACTIVE' })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'Activity Archived',
          body: `Activity "${activity.title}" has been archived`,
          data: { activityId: activity.id },
        },
        {
          type: NotificationType.JRS_ACTIVITY_ARCHIVED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }

  private async notifyActivityLocked(
    activity: JrsActivity,
    _user: UserPayload,
  ) {
    void _user;
    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'person')
      .where('member.status = :status', { status: 'ACTIVE' })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'Activity Attendance Locked',
          body: `Attendance for "${activity.title}" has been locked`,
          data: { activityId: activity.id },
        },
        {
          type: NotificationType.JRS_ACTIVITY_ATTENDANCE_LOCKED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }

  private async notifyAttendanceAddedToLocked(
    activity: JrsActivity,
    person: Person,
    _user: UserPayload,
  ) {
    void _user;
    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'p')
      .where('member.status = :status', { status: 'ACTIVE' })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'Attendance Added to Locked Activity',
          body: `${person.fullName} was added to "${activity.title}"`,
          data: { activityId: activity.id, personId: person.id },
        },
        {
          type: NotificationType.JRS_ACTIVITY_ATTENDANCE_LOCKED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }
}
