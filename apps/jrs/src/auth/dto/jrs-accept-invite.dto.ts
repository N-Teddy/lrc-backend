import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JrsAcceptInviteDto {
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
}
