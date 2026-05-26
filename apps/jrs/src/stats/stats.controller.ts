import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('activity/:id')
  getActivityStats(@Param('id') activityId: string) {
    return {
      jrsCount: this.statsService.getJrsPerActivity(activityId),
      gradeBreakdown: this.statsService.getGradePerActivity(activityId),
      nonJrsCount: this.statsService.getNonJrsPerActivity(activityId),
    };
  }

  @Get('year-month')
  getStatsByYearMonth(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.statsService.getStatsByYearMonth(year, month);
  }

  @Get('member/:id')
  getMemberStats(
    @Param('id') memberId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.statsService.getStatsByMember(memberId, year, month);
  }

  @Get('yearly/:year')
  getYearlyStats(@Param('year') year: number) {
    return this.statsService.getYearlyStats(year);
  }

  @Get('activities/by-period')
  getActivitiesByYearMonth(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('activityType') activityType?: string,
  ) {
    return this.statsService.getActivitiesByYearMonth(
      year,
      month,
      activityType,
    );
  }
}
