import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppCode } from '@app/types';

export class AcceptInviteDto {
  @ApiProperty({
    example: 'invite-token-here',
    description: 'Invitation token',
  })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newSecurePass123!', description: 'New password' })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    example: 'newSecurePass123!',
    description: 'Confirm new password',
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @ApiProperty({
    required: false,
    enum: AppCode,
    description: 'App code for the accepted invite (overrides JWT payload)',
  })
  @IsOptional()
  @IsEnum(AppCode)
  appCode?: AppCode;
}
