import { IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AppRole } from '@app/types';
import { AppCode } from '@app/types';

export class ProvisionUserDto {
  @ApiProperty({ description: 'Person ID to provision' })
  @IsString()
  personId: string;

  @ApiProperty({ enum: AppCode, description: 'App code for the profile' })
  @IsEnum(AppCode)
  appCode: AppCode;

  @ApiProperty({ description: 'Roles to assign', type: [String] })
  @IsArray()
  @IsEnum(AppRole, { each: true })
  roles: AppRole[];
}
