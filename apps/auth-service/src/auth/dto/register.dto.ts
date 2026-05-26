import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppCode } from '@app/types';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
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

  @ApiProperty({
    required: false,
    example: 'John Doe',
    description: 'Full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    required: false,
    example: '+237600000000',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    required: false,
    enum: AppCode,
    description: 'Target app code',
  })
  @IsOptional()
  @IsEnum(AppCode)
  appCode?: AppCode;
}
