import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '@app/database/entities/core/person.entity';
import { JrsMember } from '@app/database/entities/jrs/jrs-member.entity';
import { JrsActivity } from '@app/database/entities/jrs/jrs-activity.entity';
import { JrsAttendance } from '@app/database/entities/jrs/jrs-attendance.entity';
import { Town } from '@app/database/entities/core/town.entity';
import { GradeLevel } from '@app/database/entities/core/grade-level.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(JrsMember)
    private jrsMemberRepository: Repository<JrsMember>,
    @InjectRepository(JrsActivity)
    private jrsActivityRepository: Repository<JrsActivity>,
    @InjectRepository(JrsAttendance)
    private jrsAttendanceRepository: Repository<JrsAttendance>,
    @InjectRepository(Town)
    private townRepository: Repository<Town>,
    @InjectRepository(GradeLevel)
    private gradeLevelRepository: Repository<GradeLevel>,
  ) {}

  // Activity-Level Stats
  async getJrsPerActivity(activityId: string): Promise<number> {
    const count = await this.jrsAttendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin('attendance.person', 'person')
      .innerJoin('person.user', 'user')
      .innerJoin('user.appProfiles', 'appProfile')
      .innerJoin('appProfile.roles', 'role')
      .where('attendance.activityId = :activityId', { activityId })
      .andWhere('role.roleName IN (:...roles)', {
        roles: ['JRS_MEMBER', 'JRS_ADMIN'],
      }) // JRS members but not AP
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .getCount();

    return count;
  }

  async getGradePerActivity(
    activityId: string,
  ): Promise<{ gradeName: string | null; count: number }[]> {
    const gradeBreakdown = await this.jrsAttendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin('attendance.person', 'person')
      .leftJoin('person.gradeLevel', 'gradeLevel')
      .innerJoin('person.user', 'user')
      .innerJoin('user.appProfiles', 'appProfile')
      .innerJoin('appProfile.roles', 'role')
      .where('attendance.activityId = :activityId', { activityId })
      .andWhere('role.roleName IN (:...roles)', {
        roles: ['JRS_MEMBER', 'JRS_ADMIN'],
      }) // JRS members but not AP
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .select('gradeLevel.name', 'gradeName')
      .addSelect('COUNT(attendance.id)', 'count')
      .groupBy('gradeLevel.name')
      .getRawMany<{ gradeName: string | null; count: number }>();

    return gradeBreakdown;
  }

  async getNonJrsPerActivity(activityId: string): Promise<number> {
    const count = await this.jrsAttendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin('attendance.person', 'person')
      .leftJoin('person.user', 'user')
      .leftJoin('user.appProfiles', 'appProfile')
      .leftJoin('appProfile.roles', 'role')
      .where('attendance.activityId = :activityId', { activityId })
      .andWhere('(role IS NULL OR role.roleName NOT IN (:...roles))', {
        roles: ['JRS_MEMBER', 'JRS_ADMIN', 'JRS_PC', 'JRS_AP'],
      })
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .getCount();

    return count;
  }

  async getAlwaysPresentMembers(threshold: number = 0.8): Promise<
    {
      personId: string;
      fullName: string;
      attendanceRate: number;
      attendedActivities: number;
      totalActivities: number;
    }[]
  > {
    // Get all JRS members (excluding AP)
    const jrsMembers = await this.jrsMemberRepository
      .createQueryBuilder('jrsMember')
      .innerJoin('jrsMember.person', 'person')
      .leftJoin('person.user', 'user')
      .leftJoin('user.appProfiles', 'appProfile')
      .leftJoin('appProfile.roles', 'role')
      .where('(role.roleName IS NULL OR role.roleName NOT IN (:...roles))', {
        roles: ['JRS_AP'],
      }) // Exclude AP
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .select('person.id', 'personId')
      .addSelect('person.fullName', 'fullName')
      .getRawMany<{ personId: string; fullName: string }>();

    if (jrsMembers.length === 0) {
      return [];
    }

    // Get total number of activities
    const totalActivities = await this.jrsActivityRepository.count();

    if (totalActivities === 0) {
      // If no activities, return empty array or all members with 0 attendance rate?
      return jrsMembers.map((member) => ({
        ...member,
        attendanceRate: 0,
        attendedActivities: 0,
        totalActivities: 0,
      }));
    }

    // For each member, count attended activities
    const alwaysPresent: {
      personId: string;
      fullName: string;
      attendanceRate: number;
      attendedActivities: number;
      totalActivities: number;
    }[] = [];
    for (const member of jrsMembers) {
      const attendedActivities = await this.jrsAttendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.person', 'person')
        .where('person.id = :personId', { personId: member.personId })
        .getCount();

      const attendanceRate = attendedActivities / totalActivities;

      if (attendanceRate >= threshold) {
        alwaysPresent.push({
          ...member,
          attendanceRate,
          attendedActivities,
          totalActivities,
        });
      }
    }

    return alwaysPresent;
  }

  async getConsecutiveAbsences(
    threshold: number = 3,
  ): Promise<
    { memberId: string; fullName: string; consecutiveAbsences: number }[]
  > {
    // Get all activities ordered by startDate (ascending)
    const activities = await this.jrsActivityRepository
      .createQueryBuilder('activity')
      .orderBy('activity.startDate', 'ASC')
      .getMany();

    if (activities.length === 0) {
      return [];
    }

    // Get all JRS members (excluding AP)
    const jrsMembers = await this.jrsMemberRepository
      .createQueryBuilder('jrsMember')
      .innerJoin('jrsMember.person', 'person')
      .leftJoin('person.user', 'user')
      .leftJoin('user.appProfiles', 'appProfile')
      .leftJoin('appProfile.roles', 'role')
      .where('(role.roleName IS NULL OR role.roleName NOT IN (:...roles))', {
        roles: ['JRS_AP'],
      }) // Exclude AP
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .select('person.id', 'memberId')
      .addSelect('person.fullName', 'fullName')
      .getRawMany<{ memberId: string; fullName: string }>();

    if (jrsMembers.length === 0) {
      return [];
    }

    // Get attendance records for these members and activities
    const memberIds = jrsMembers.map((m) => m.memberId);
    const activityIds = activities.map((a) => a.id);

    const attendances = await this.jrsAttendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.personId IN (:...memberIds)', { memberIds })
      .andWhere('attendance.activityId IN (:...activityIds)', { activityIds })
      .getMany();

    // Create a map for quick lookup: memberId -> Set of activityIds they attended
    const attendanceMap = new Map<string, Set<string>>();
    for (const attendance of attendances) {
      if (!attendanceMap.has(attendance.personId)) {
        attendanceMap.set(attendance.personId, new Set());
      }
      attendanceMap.get(attendance.personId)!.add(attendance.activityId);
    }

    // Check each member for consecutive absences
    const membersAtRisk: {
      memberId: string;
      fullName: string;
      consecutiveAbsences: number;
    }[] = [];
    for (const member of jrsMembers) {
      const attendedActivities =
        attendanceMap.get(member.memberId) || new Set<string>();
      let consecutiveAbsences = 0;

      for (const activity of activities) {
        if (attendedActivities.has(activity.id)) {
          // Reset consecutive absences if attended
          consecutiveAbsences = 0;
        } else {
          // Increment consecutive absences
          consecutiveAbsences++;
          if (consecutiveAbsences >= threshold) {
            membersAtRisk.push({
              memberId: member.memberId,
              fullName: member.fullName,
              consecutiveAbsences,
            });
            break; // No need to check further for this member
          }
        }
      }
    }

    return membersAtRisk;
  }

  // Time-Based Stats
  async getStatsByYearMonth(
    year: number,
    month: number,
  ): Promise<{
    year: number;
    month: number;
    activities: {
      activityId: string;
      activityTitle: string;
      activityType: string;
      jrsCount: number;
      nonJrsCount: number;
      gradeBreakdown: { gradeName: string | null; count: number }[];
    }[];
  }> {
    // Get activities in the specified month/year
    const activities = await this.jrsActivityRepository
      .createQueryBuilder('activity')
      .where('EXTRACT(YEAR FROM activity.startDate) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM activity.startDate) = :month', { month })
      .getMany();

    // For each activity, get stats
    const activityStats = await Promise.all(
      activities.map(async (activity) => {
        const jrsCount = await this.getJrsPerActivity(activity.id);
        const gradeBreakdown = await this.getGradePerActivity(activity.id);
        const nonJrsCount = await this.getNonJrsPerActivity(activity.id);

        return {
          activityId: activity.id,
          activityTitle: activity.title,
          activityType: activity.activityType,
          jrsCount,
          nonJrsCount,
          gradeBreakdown,
        };
      }),
    );

    return {
      year,
      month,
      activities: activityStats,
    };
  }

  async getStatsByMember(
    memberId: string,
    year: number,
    month: number,
  ): Promise<{
    memberId: string;
    fullName: string;
    year: number;
    month: number;
    totalActivitiesInPeriod: number;
    attendedActivities: number;
    attendanceRate: number;
  }> {
    // Get member info
    const member = await this.jrsMemberRepository
      .createQueryBuilder('jrsMember')
      .innerJoin('jrsMember.person', 'person')
      .where('jrsMember.id = :memberId', { memberId })
      .select('person.id', 'personId')
      .addSelect('person.fullName', 'fullName')
      .getRawOne<{ personId: string; fullName: string }>();

    if (!member) {
      throw new Error('Member not found');
    }

    // Get activities in the specified month/year that the member attended
    const attendedActivities = await this.jrsAttendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin('attendance.person', 'person')
      .where('person.id = :personId', { personId: member.personId })
      .andWhere('EXTRACT(YEAR FROM attendance.createdAt) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM attendance.createdAt) = :month', { month })
      .getCount();

    // Get total activities in the specified month/year
    const totalActivities = await this.jrsActivityRepository
      .createQueryBuilder('activity')
      .where('EXTRACT(YEAR FROM activity.startDate) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM activity.startDate) = :month', { month })
      .getCount();

    return {
      memberId: member.personId,
      fullName: member.fullName,
      year,
      month,
      totalActivitiesInPeriod: totalActivities,
      attendedActivities: attendedActivities,
      attendanceRate:
        totalActivities > 0 ? attendedActivities / totalActivities : 0,
    };
  }

  async getActivitiesByYearMonth(
    year: number,
    month: number,
    activityType?: string,
  ): Promise<JrsActivity[]> {
    const query = this.jrsActivityRepository
      .createQueryBuilder('activity')
      .where('EXTRACT(YEAR FROM activity.startDate) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM activity.startDate) = :month', { month });

    if (activityType) {
      query.andWhere('activity.activityType = :activityType', { activityType });
    }

    return query.getMany();
  }

  // Yearly Stats
  async getYearlyStats(year: number): Promise<{
    year: number;
    monthlyStats: {
      year: number;
      month: number;
      activities: {
        activityId: string;
        activityTitle: string;
        activityType: string;
        jrsCount: number;
        nonJrsCount: number;
        gradeBreakdown: { gradeName: string | null; count: number }[];
      }[];
    }[];
    totals: {
      jrs: number;
      nonJrs: number;
      activities: number;
    };
  }> {
    // Get all months for the year
    const monthlyStats = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map((month) =>
        this.getStatsByYearMonth(year, month),
      ),
    );

    // Calculate totals
    let totalJrs = 0;
    let totalNonJrs = 0;
    let totalActivities = 0;

    for (const monthStats of monthlyStats) {
      for (const activity of monthStats.activities) {
        totalJrs += activity.jrsCount;
        totalNonJrs += activity.nonJrsCount;
        totalActivities++;
      }
    }

    return {
      year,
      monthlyStats,
      totals: {
        jrs: totalJrs,
        nonJrs: totalNonJrs,
        activities: totalActivities,
      },
    };
  }
}
