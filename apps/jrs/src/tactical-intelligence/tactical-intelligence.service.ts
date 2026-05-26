import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '@app/database/entities/core/person.entity';
import { JrsMember } from '@app/database/entities/jrs/jrs-member.entity';
import { JrsActivity } from '@app/database/entities/jrs/jrs-activity.entity';
import { JrsAttendance } from '@app/database/entities/jrs/jrs-attendance.entity';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class TacticalIntelligenceService {
  private readonly logger = new Logger(TacticalIntelligenceService.name);

  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(JrsMember)
    private jrsMemberRepository: Repository<JrsMember>,
    @InjectRepository(JrsActivity)
    private jrsActivityRepository: Repository<JrsActivity>,
    @InjectRepository(JrsAttendance)
    private jrsAttendanceRepository: Repository<JrsAttendance>,
    private statsService: StatsService,
  ) {}

  // Attendance Leaders
  async getAttendanceLeaders(limit: number = 10): Promise<
    {
      memberId: string;
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
      .select('person.id', 'memberId')
      .addSelect('person.fullName', 'fullName')
      .getRawMany<{ memberId: string; fullName: string }>();

    if (jrsMembers.length === 0) {
      return [];
    }

    // Get total number of activities
    const totalActivities = await this.jrsActivityRepository.count();

    if (totalActivities === 0) {
      // If no activities, return all members with 0 attendance rate
      return jrsMembers
        .map((member) => ({
          memberId: member.memberId,
          fullName: member.fullName,
          attendanceRate: 0,
          attendedActivities: 0,
          totalActivities: 0,
        }))
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .slice(0, limit);
    }

    // For each member, count attended activities and calculate attendance rate
    const membersWithAttendance = await Promise.all(
      jrsMembers.map(async (member) => {
        const attendedActivities = await this.jrsAttendanceRepository
          .createQueryBuilder('attendance')
          .innerJoin('attendance.person', 'person')
          .where('person.id = :personId', { personId: member.memberId })
          .getCount();

        const attendanceRate = attendedActivities / totalActivities;

        return {
          memberId: member.memberId,
          fullName: member.fullName,
          attendanceRate,
          attendedActivities,
          totalActivities,
        };
      }),
    );

    // Sort by attendance rate (descending) and limit
    return membersWithAttendance
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, limit);
  }

  // Members at Risk
  async getMembersAtRisk(): Promise<
    {
      memberId: string;
      fullName: string;
      attendanceRate?: number;
      consecutiveAbsences?: number;
    }[]
  > {
    // Get members with attendance < 60%
    const lowAttendanceMembers = await this.getLowAttendanceMembers(0.6);

    // Get members with 3+ consecutive absences
    const consecutiveAbsenceMembers =
      await this.statsService.getConsecutiveAbsences(3);

    // Combine and deduplicate (by memberId)
    const allAtRisk = [...lowAttendanceMembers, ...consecutiveAbsenceMembers];
    const seen = new Set<string>();
    const uniqueAtRisk: {
      memberId: string;
      fullName: string;
      attendanceRate?: number;
      consecutiveAbsences?: number;
    }[] = [];

    for (const member of allAtRisk) {
      if (!seen.has(member.memberId)) {
        seen.add(member.memberId);
        uniqueAtRisk.push(member);
      }
    }

    return uniqueAtRisk;
  }

  private async getLowAttendanceMembers(threshold: number): Promise<
    {
      memberId: string;
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
      .select('person.id', 'memberId')
      .addSelect('person.fullName', 'fullName')
      .getRawMany<{ memberId: string; fullName: string }>();

    if (jrsMembers.length === 0) {
      return [];
    }

    // Get total number of activities
    const totalActivities = await this.jrsActivityRepository.count();

    if (totalActivities === 0) {
      // If no activities, no one is at risk for low attendance
      return [];
    }

    // For each member, count attended activities and calculate attendance rate
    const lowAttendance = await Promise.all(
      jrsMembers.map(async (member) => {
        const attendedActivities = await this.jrsAttendanceRepository
          .createQueryBuilder('attendance')
          .innerJoin('attendance.person', 'person')
          .where('person.id = :personId', { personId: member.memberId })
          .getCount();

        const attendanceRate = attendedActivities / totalActivities;

        return {
          memberId: member.memberId,
          fullName: member.fullName,
          attendanceRate,
          attendedActivities,
          totalActivities,
        };
      }),
    );

    return lowAttendance.filter((member) => member.attendanceRate < threshold);
  }

  // Growth Dynamic
  async getGrowthDynamic(year: number): Promise<
    {
      month: number;
      newMembers: number;
      totalActivities: number;
      totalJrsAttendance: number;
      totalNonJrsAttendance: number;
    }[]
  > {
    // Get all months for the year
    const monthlyData = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
        const stats = await this.statsService.getStatsByYearMonth(year, month);

        // Count new members in this month (members who joined in this month)
        const newMembers = await this.jrsMemberRepository
          .createQueryBuilder('jrsMember')
          .innerJoin('jrsMember.person', 'person')
          .where('EXTRACT(YEAR FROM jrsMember.joinDate) = :year', { year })
          .andWhere('EXTRACT(MONTH FROM jrsMember.joinDate) = :month', {
            month,
          })
          .getCount();

        return {
          month,
          newMembers,
          totalActivities: stats.activities.length,
          totalJrsAttendance: stats.activities.reduce(
            (sum, activity) => sum + activity.jrsCount,
            0,
          ),
          totalNonJrsAttendance: stats.activities.reduce(
            (sum, activity) => sum + activity.nonJrsCount,
            0,
          ),
        };
      }),
    );

    return monthlyData;
  }

  // Activity Resonance
  async getActivityResonance(year: number): Promise<
    {
      activityId: string;
      activityTitle: string;
      activityType: string;
      jrsCount: number;
      nonJrsCount: number;
      totalAttendance: number;
    }[]
  > {
    // Get all activities for the year
    const activities = await this.jrsActivityRepository
      .createQueryBuilder('activity')
      .where('EXTRACT(YEAR FROM activity.startDate) = :year', { year })
      .getMany();

    if (activities.length === 0) {
      return [];
    }

    // For each activity, get attendance count and type
    const activityStats = await Promise.all(
      activities.map(async (activity) => {
        const jrsCount = await this.statsService.getJrsPerActivity(activity.id);
        const nonJrsCount = await this.statsService.getNonJrsPerActivity(
          activity.id,
        );
        const totalAttendance = jrsCount + nonJrsCount;

        return {
          activityId: activity.id,
          activityTitle: activity.title,
          activityType: activity.activityType,
          jrsCount,
          nonJrsCount,
          totalAttendance,
        };
      }),
    );

    // Sort by total attendance (descending)
    return activityStats.sort((a, b) => b.totalAttendance - a.totalAttendance);
  }
}
