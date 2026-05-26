import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppCode } from '@app/types';

export class ResendInviteDto {
  @ApiProperty({ example: 'person-uuid-here', description: 'Person ID' })
  @IsString()
  personId: string;

  @ApiProperty({ example: 'ADMIN', description: 'App code' })
  @IsEnum(AppCode)
  appCode: AppCode;
}
