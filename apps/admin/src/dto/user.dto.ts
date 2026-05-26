import {
  IsString,
  MinLength,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, PersonStatus, AppCode } from '@app/types';

export class AppRoleResponseDto {
  @ApiProperty({ example: 'b2c0104c-3e0a-41c5-b277-5c518218cf15' })
  id: string;

  @ApiProperty({ example: '2026-05-13T18:47:11.719Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-13T18:47:11.719Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system' })
  createdBy: string;

  @ApiProperty({ example: 'system' })
  updatedBy: string;

  @ApiProperty({ example: '2851ef66-035d-441a-b881-a1009e18d71c' })
  appProfileId: string;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  roleName: string;
}

export class AppProfileResponseDto {
  @ApiProperty({ example: '2851ef66-035d-441a-b881-a1009e18d71c' })
  id: string;

  @ApiProperty({ example: '2026-05-13T18:47:11.711Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-13T18:47:11.711Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system' })
  createdBy: string;

  @ApiProperty({ example: 'system' })
  updatedBy: string;

  @ApiProperty({ example: '754ae9dc-cdbd-4a90-b7ea-e7b74bf8ad9a' })
  userId: string;

  @ApiProperty({ enum: AppCode, example: AppCode.ADMIN })
  appCode: AppCode;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [AppRoleResponseDto] })
  roles: AppRoleResponseDto[];
}

export class PersonWithUserResponseDto {
  @ApiProperty({ example: 'aea44cc6-0ac6-4872-9ec4-03743dfe76e0' })
  id: string;

  @ApiProperty({ example: '2026-05-13T18:47:11.091Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-13T18:47:11.091Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system' })
  createdBy: string;

  @ApiProperty({ example: 'system' })
  updatedBy: string;

  @ApiProperty({ example: 'System Administrator' })
  fullName: string;

  @ApiProperty({ example: 'admin@lrc.org' })
  email: string;

  @ApiProperty({ example: '+237600000000' })
  phone: string;

  @ApiProperty({ enum: Gender, example: Gender.OTHER })
  gender: Gender;

  @ApiPropertyOptional({ example: '1990-01-01' })
  dob: Date | null;

  @ApiPropertyOptional({ example: 'https://example.com/pic.jpg' })
  picture: string | null;

  @ApiProperty({ enum: PersonStatus, example: PersonStatus.ALIVE })
  status: PersonStatus;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiPropertyOptional({ example: 'Grade 10' })
  grade: string | null;

  @ApiPropertyOptional({ example: '61d646c1-5c41-4421-af04-3cf74f3d6cf9' })
  townId: string | null;

  @ApiPropertyOptional()
  town: unknown;

  @ApiProperty({ example: '1622bc87-f0b0-408d-a065-5d3e7ca04e86' })
  countryId: string;

  @ApiProperty()
  country: unknown;
}

export class UserListResponseDto {
  @ApiProperty({ example: '754ae9dc-cdbd-4a90-b7ea-e7b74bf8ad9a' })
  id: string;

  @ApiProperty({ example: '2026-05-13T18:47:11.678Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-14T16:33:44.442Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system' })
  createdBy: string;

  @ApiProperty({ example: 'system' })
  updatedBy: string;

  @ApiProperty({ example: 'aea44cc6-0ac6-4872-9ec4-03743dfe76e0' })
  personId: string;

  @ApiProperty({ type: PersonWithUserResponseDto })
  person: PersonWithUserResponseDto;

  @ApiProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty({ example: false })
  isWhatsAppVerified: boolean;

  @ApiPropertyOptional({ example: '2026-05-14T16:33:44.423Z' })
  lastLogin: Date | null;
}

export class UserDetailResponseDto {
  @ApiProperty({ example: '754ae9dc-cdbd-4a90-b7ea-e7b74bf8ad9a' })
  id: string;

  @ApiProperty({ example: '2026-05-13T18:47:11.678Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-14T16:33:44.442Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system' })
  createdBy: string;

  @ApiProperty({ example: 'system' })
  updatedBy: string;

  @ApiProperty({ example: 'aea44cc6-0ac6-4872-9ec4-03743dfe76e0' })
  personId: string;

  @ApiProperty({ type: PersonWithUserResponseDto })
  person: PersonWithUserResponseDto;

  @ApiProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty({ example: false })
  isWhatsAppVerified: boolean;

  @ApiPropertyOptional({ example: '2026-05-14T16:33:44.423Z' })
  lastLogin: Date | null;

  @ApiProperty({ type: [AppProfileResponseDto] })
  appProfiles: AppProfileResponseDto[];
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default: 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (default: 10, max: 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: AppCode,
    example: AppCode.JRS,
    description: 'Filter by app code',
  })
  @IsOptional()
  @IsEnum(AppCode)
  appCode?: AppCode;

  @ApiPropertyOptional({
    example: 'JRS_MEMBER',
    description: 'Filter by role name',
  })
  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'uuid-person-id', description: 'Person ID' })
  @IsUUID()
  personId: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'password123',
    description: 'Confirm password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false, description: 'Email verification status' })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiProperty({ required: false, description: 'WhatsApp verification status' })
  @IsOptional()
  @IsBoolean()
  isWhatsAppVerified?: boolean;
}
