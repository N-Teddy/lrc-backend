import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JrsActivityService } from './jrs-activity.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityFilterDto,
  MarkAttendanceDto,
  AttendanceFilterDto,
} from './dto';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '@app/common';
import { JrsRole } from '@app/types';
import type { UserPayload } from '@app/types';

@ApiTags('activities')
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JrsActivityController {
  constructor(private readonly activityService: JrsActivityService) {}

  @Post()
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.create(dto, user);
  }

  @Get()
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP, JrsRole.JRS_MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all activities with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of activities',
  })
  async findAll(
    @Query() filters: ActivityFilterDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.findAll(filters, user);
  }

  @Get(':id')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP, JrsRole.JRS_MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Returns activity details' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update activity' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.update(id, dto, user);
  }

  @Patch(':id/cancel')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel activity' })
  @ApiResponse({ status: 200, description: 'Activity cancelled' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async cancel(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.cancel(id, user);
  }

  @Patch(':id/archive')
  @Roles(JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive activity (AP only)' })
  @ApiResponse({ status: 200, description: 'Activity archived' })
  @ApiResponse({
    status: 400,
    description: 'Cannot archive activity with attendance',
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async archive(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.archive(id, user);
  }

  @Patch(':id/lock')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock activity attendance' })
  @ApiResponse({ status: 200, description: 'Activity locked' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async lock(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.lockActivity(id, user);
  }

  @Get(':id/attendance')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attendance for activity with pagination' })
  @ApiResponse({ status: 200, description: 'Returns attendance list' })
  async getAttendance(
    @Param('id') id: string,
    @Query() filters: AttendanceFilterDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.getAttendance(id, filters, user);
  }

  @Post(':id/attendance')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark attendance for activity' })
  @ApiResponse({ status: 201, description: 'Attendance recorded' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Cannot add to locked activity (non-AP)',
  })
  async markAttendance(
    @Param('id') id: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.markAttendance(id, dto, user);
  }

  @Delete(':id/attendance/:personId')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance removed' })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove from locked activity',
  })
  async removeAttendance(
    @Param('id') id: string,
    @Param('personId') personId: string,
  ) {
    return this.activityService.removeAttendance(id, personId);
  }

  @Delete(':id')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete activity - not allowed' })
  @ApiResponse({ status: 403, description: 'Delete not allowed' })
  delete(@Param('id') id: string): unknown {
    void id;
    return { message: 'Delete not allowed. Use archive endpoint for AP only.' };
  }
}
