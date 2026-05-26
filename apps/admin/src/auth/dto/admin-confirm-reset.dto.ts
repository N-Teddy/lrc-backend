import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminConfirmResetDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Reset token from email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'password123@',
    description: 'New password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    example: 'password123@',
    description: 'Confirm new password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
