import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsEmail,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, PersonStatus } from '@app/types';

export class PersonResponseDto {
  @ApiProperty({ example: 'f4b56eba-5b44-4f38-8f6b-3038e37402ac' })
  id: string;

  @ApiProperty({ example: '2026-05-14T07:57:04.907Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-14T08:06:46.293Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system' })
  createdBy: string;

  @ApiProperty({ example: 'system' })
  updatedBy: string;

  @ApiProperty({ example: 'Jean Dupont' })
  fullName: string;

  @ApiProperty({ example: 'jrs1@lrc.org' })
  email: string;

  @ApiProperty({ example: '+237600000001' })
  phone: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
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

export class PersonPaginationQueryDto {
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
    example: '61d646c1-5c41-4421-af04-3cf74f3d6cf9',
    description: 'Filter by town ID',
  })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiPropertyOptional({
    example: '1622bc87-f0b0-408d-a065-5d3e7ca04e86',
    description: 'Filter by country ID',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by archived status',
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class CreatePersonDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    required: false,
    example: '+237600000000',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, enum: Gender, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    required: false,
    example: '61d646c1-5c41-4421-af04-3cf74f3d6cf9',
    description: 'Grade ID',
  })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiProperty({
    required: false,
    enum: PersonStatus,
    description: 'Person status',
  })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

  @ApiProperty({ example: 'uuid-town-id', description: 'Town ID' })
  @IsUUID()
  townId: string;

  @ApiProperty({ example: 'uuid-country-id', description: 'Country ID' })
  @IsUUID()
  countryId: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/pic.jpg',
    description: 'Profile picture URL',
  })
  @IsOptional()
  @IsString()
  picture?: string;
}

export class UpdatePersonDto {
  @ApiProperty({
    required: false,
    example: 'John Doe',
    description: 'Full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiProperty({
    required: false,
    example: 'john@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    required: false,
    example: '+237600000000',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, enum: Gender, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    required: false,
    example: '61d646c1-5c41-4421-af04-3cf74f3d6cf9',
    description: 'Grade ID',
  })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiProperty({
    required: false,
    example: 'uuid-town-id',
    description: 'Town ID',
  })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

  @ApiProperty({
    required: false,
    example: 'uuid-town-id',
    description: 'Town ID',
  })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiProperty({
    required: false,
    example: 'uuid-country-id',
    description: 'Country ID',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/pic.jpg',
    description: 'Profile picture URL',
  })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({ required: false, description: 'Archive status' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
