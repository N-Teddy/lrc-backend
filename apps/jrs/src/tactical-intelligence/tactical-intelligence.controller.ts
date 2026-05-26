import { Controller, Get, Param } from '@nestjs/common';
import { TacticalIntelligenceService } from './tactical-intelligence.service';

@Controller('tactical')
export class TacticalIntelligenceController {
  constructor(
    private readonly tacticalIntelligenceService: TacticalIntelligenceService,
  ) {}

  @Get('attendance-leaders')
  getAttendanceLeaders() {
    return this.tacticalIntelligenceService.getAttendanceLeaders();
  }

  @Get('members-at-risk')
  getMembersAtRisk() {
    return this.tacticalIntelligenceService.getMembersAtRisk();
  }

  @Get('growth-dynamic/:year')
  getGrowthDynamic(@Param('year') year: number) {
    return this.tacticalIntelligenceService.getGrowthDynamic(year);
  }

  @Get('activity-resonance/:year')
  getActivityResonance(@Param('year') year: number) {
    return this.tacticalIntelligenceService.getActivityResonance(year);
  }
}
