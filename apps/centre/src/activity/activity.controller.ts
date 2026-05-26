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
import { ActivityService } from './activity.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityFilterDto,
  MarkAttendanceDto,
  AttendanceFilterDto,
} from './dto';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '@app/common';
import { AppRole } from '@app/types';
import type { UserPayload } from '@app/types';

@ApiTags('activities')
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Not authorized for COUNTRY scope' })
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.create(dto, user);
  }

  @Get()
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
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
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Returns activity details' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
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
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel activity' })
  @ApiResponse({ status: 200, description: 'Activity cancelled' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async cancel(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.cancel(id, user);
  }

  @Patch(':id/lock')
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock activity attendance' })
  @ApiResponse({ status: 200, description: 'Activity locked' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async lock(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.lockActivity(id, user);
  }

  @Patch(':id/archive')
  @Roles(AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive activity (Intendant only)' })
  @ApiResponse({ status: 200, description: 'Activity archived' })
  @ApiResponse({
    status: 400,
    description: 'Cannot archive activity with attendance',
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async archive(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.activityService.archive(id, user);
  }

  @Get(':id/attendance')
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
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
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark attendance for activity' })
  @ApiResponse({ status: 201, description: 'Attendance recorded' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async markAttendance(
    @Param('id') id: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.markAttendance(id, dto, user);
  }

  @Delete(':id/attendance/:personId')
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
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
    @CurrentUser() user: UserPayload,
  ) {
    return this.activityService.removeAttendance(id, personId, user);
  }

  @Delete(':id')
  @Roles(AppRole.CENTRE_CHEF, AppRole.INTENDANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete not allowed - use archive' })
  @ApiResponse({ status: 403, description: 'Delete not allowed' })
  delete(@Param('id') id: string): unknown {
    void id;
    return {
      message: 'Delete not allowed. Use archive endpoint for Intendant.',
    };
  }
}
