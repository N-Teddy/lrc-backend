import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberStatus } from '@app/types';

export class CreateMemberDto {
  @ApiProperty({ description: 'Person ID (must reference an existing Person)' })
  @IsUUID()
  personId: string;

  @ApiPropertyOptional({
    description: 'Member status',
    default: MemberStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ description: 'Is Personne Contact', default: false })
  @IsOptional()
  @IsBoolean()
  isPc?: boolean;

  @ApiPropertyOptional({
    description: 'Is Accompagnateur Parental',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAp?: boolean;

  @ApiPropertyOptional({
    description: 'Has system access (login credentials)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasSystemAccess?: boolean;

  @ApiPropertyOptional({
    description: 'Roles to grant if hasSystemAccess is true',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantRoles?: string[];
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ description: 'Member status' })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ description: 'Is Personne Contact' })
  @IsOptional()
  @IsBoolean()
  isPc?: boolean;

  @ApiPropertyOptional({ description: 'Is Accompagnateur Parental' })
  @IsOptional()
  @IsBoolean()
  isAp?: boolean;

  @ApiPropertyOptional({ description: 'Has system access (login credentials)' })
  @IsOptional()
  @IsBoolean()
  hasSystemAccess?: boolean;
}

export class MemberFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ description: 'Filter by PC status' })
  @IsOptional()
  @IsBoolean()
  isPc?: boolean;

  @ApiPropertyOptional({ description: 'Filter by AP status' })
  @IsOptional()
  @IsBoolean()
  isAp?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by grade level ID (from Person)',
  })
  @IsOptional()
  @IsUUID()
  gradeLevelId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Include archived members',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;
}
