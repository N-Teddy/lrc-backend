import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminProvisionUserDto } from './admin-provision-user.dto';
import { AdminResendInviteDto } from './admin-resend-invite.dto';
import { AdminAcceptInviteDto } from './admin-accept-invite.dto';
import { AdminPasswordResetRequestDto } from './admin-password-reset-request.dto';
import { AdminConfirmResetDto } from './admin-confirm-reset.dto';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Admin email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Admin password' })
  @IsString()
  @MinLength(6)
  pass: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'jwt-refresh-token-here',
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}

export {
  AdminPasswordResetRequestDto,
  AdminConfirmResetDto,
  AdminProvisionUserDto,
  AdminResendInviteDto,
  AdminAcceptInviteDto,
};
