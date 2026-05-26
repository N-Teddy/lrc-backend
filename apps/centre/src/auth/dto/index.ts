import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  pass: string;
}

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
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'jwt-refresh-token-here',
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;
}

export class ConfirmResetDto {
  @ApiProperty({
    example: 'jwt-reset-token-here',
    description: 'Reset token',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Confirm new password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
