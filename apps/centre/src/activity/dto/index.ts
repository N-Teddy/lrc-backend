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
import { CentreActivityType, ActivityScope } from '@app/types';

export class CreateActivityDto {
  @ApiProperty({ description: 'Activity title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Activity type', enum: CentreActivityType })
  @IsEnum(CentreActivityType)
  activityType: CentreActivityType;

  @ApiPropertyOptional({ 
    description: 'Target groups specification (e.g., "ab", "jrs", "ecole interieur")',
    example: "ab"
  })
  @IsOptional()
  @IsString()
  targetGroups?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Activity scope',
    enum: ActivityScope,
    default: ActivityScope.TOWN,
  })
  @IsEnum(ActivityScope)
  scope: ActivityScope;
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
}

export class ActivityFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by activity type',
    enum: CentreActivityType,
  })
  @IsOptional()
  @IsEnum(CentreActivityType)
  activityType?: CentreActivityType;

  @ApiPropertyOptional({
    description: 'Filter by scope',
    enum: ActivityScope,
  })
  @IsOptional()
  @IsEnum(ActivityScope)
  scope?: ActivityScope;

  @ApiPropertyOptional({ description: 'Filter by town ID' })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({ description: 'Filter by country ID' })
  @IsOptional()
  @IsUUID()
  countryId?: string;

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
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'Person ID to mark attendance for' })
  @IsUUID()
  personId: string;
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({ description: 'Filter by town ID' })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}