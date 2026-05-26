import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminPasswordResetRequestDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Admin email' })
  @IsEmail()
  email: string;
}
