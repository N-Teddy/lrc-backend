import { IsString, IsArray, IsEnum } from 'class-validator';
import { AppRole } from '@app/types';
import { ApiProperty } from '@nestjs/swagger';

export class AdminProvisionUserDto {
  @ApiProperty()
  @IsString()
  personId: string;

  @ApiProperty({ description: 'Roles to assign', enum: AppRole, isArray: true })
  @IsArray()
  @IsEnum(AppRole, { each: true })
  roles: AppRole[];
}
