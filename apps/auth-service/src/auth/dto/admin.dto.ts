import { IsUUID, IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppCode } from '@app/types';

export class AssignRolesDto {
  @ApiProperty({ description: 'Person ID to assign roles to' })
  @IsUUID()
  personId: string;

  @ApiProperty({ description: 'App code for the profile' })
  @IsEnum(AppCode)
  appCode: AppCode;

  @ApiProperty({ description: 'Roles to assign' })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class RemoveRolesDto {
  @ApiProperty({ description: 'Person ID to remove roles from' })
  @IsUUID()
  personId: string;

  @ApiProperty({ description: 'App code for the profile' })
  @IsEnum(AppCode)
  appCode: AppCode;

  @ApiProperty({ description: 'Roles to remove' })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class DeactivateProfileDto {
  @ApiProperty({ description: 'Person ID whose profile should be deactivated' })
  @IsUUID()
  personId: string;

  @ApiProperty({ description: 'App code for the profile' })
  @IsEnum(AppCode)
  appCode: AppCode;
}

export class CreateUserWithProfileDto {
  @ApiProperty({ description: 'Person ID to create user for' })
  @IsUUID()
  personId: string;

  @ApiProperty({ description: 'App code for the profile' })
  @IsEnum(AppCode)
  appCode: AppCode;

  @ApiProperty({ description: 'Roles to assign', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty({ description: 'Password for the user', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
