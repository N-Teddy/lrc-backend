import {
  IsUUID,
  IsEnum,
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppCode } from '@app/types';

export class ProfilePaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default: 1)',
  })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (default: 10, max: 100)',
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: AppCode,
    example: AppCode.JRS,
    description: 'Filter by app code',
  })
  @IsOptional()
  @IsEnum(AppCode)
  appCode?: AppCode;

  @ApiPropertyOptional({
    example: 'JRS_MEMBER',
    description: 'Filter by role name',
  })
  @IsOptional()
  @IsString()
  role?: string;
}

export class AssignProfileDto {
  @ApiProperty({ example: 'uuid-user-id', description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: AppCode, description: 'Application code' })
  @IsEnum(AppCode)
  appCode: AppCode;

  @ApiProperty({
    example: ['ADMIN', 'VIEWER'],
    description: 'Role names',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
