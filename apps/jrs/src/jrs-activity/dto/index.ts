import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityStatus, ActivityScope } from '@app/types';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @ApiProperty({ description: 'Activity title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Activity type', enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiPropertyOptional({ description: 'Town ID' })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({ description: 'Country ID' })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date (auto-set for single-day activities)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Is conference type', default: false })
  @IsOptional()
  @IsBoolean()
  isConference?: boolean;

  @ApiPropertyOptional({
    description: 'Activity scope',
    enum: ActivityScope,
    default: ActivityScope.TOWN,
  })
  @IsOptional()
  @IsEnum(ActivityScope)
  scope?: ActivityScope;
}

export class UpdateActivityDto {
  @ApiPropertyOptional({ description: 'Activity title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Town ID' })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Is conference type' })
  @IsOptional()
  @IsBoolean()
  isConference?: boolean;

  @ApiPropertyOptional({ description: 'Activity status', enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}

export class ActivityFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by activity type',
    enum: ActivityType,
  })
  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @ApiPropertyOptional({ description: 'Filter by town ID' })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ActivityStatus,
  })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ description: 'Filter by isConference' })
  @IsOptional()
  @IsBoolean()
  isConference?: boolean;

  @ApiPropertyOptional({ description: 'Filter by start date from' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by start date to' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'Person ID to mark attendance for' })
  @IsUUID()
  personId: string;

  @ApiPropertyOptional({ description: 'Member ID (if person is a JRS member)' })
  @IsOptional()
  @IsUUID()
  memberId?: string;
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({ description: 'Filter by town ID' })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
