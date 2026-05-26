import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, PersonStatus } from '@app/types';

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
    example: '61d646c1-5b44-4f38-8f6b-3038e37402ac',
    description: 'Grade level ID',
  })
  @IsOptional()
  @IsString()
  gradeLevelId?: string;

  @ApiProperty({
    required: false,
    enum: PersonStatus,
    description: 'Person status',
  })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

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
    example: '61d646c1-5b44-4f38-8f6b-3038e37402ac',
    description: 'Grade level ID',
  })
  @IsOptional()
  @IsString()
  gradeLevelId?: string;

  @ApiProperty({
    required: false,
    enum: PersonStatus,
    description: 'Person status',
  })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

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
  isArchived?: boolean;
}
