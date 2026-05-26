import { IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'uuid-profile-id', description: 'App profile ID' })
  @IsUUID()
  appProfileId: string;

  @ApiProperty({ example: 'ADMIN', description: 'Role name' })
  @IsString()
  @MinLength(2)
  roleName: string;
}
