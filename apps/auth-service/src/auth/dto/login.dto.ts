import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppCode } from '@app/types';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  pass: string;

  @ApiProperty({
    required: false,
    enum: AppCode,
    description: 'Target app code',
  })
  @IsOptional()
  @IsEnum(AppCode)
  appCode?: AppCode;
}
