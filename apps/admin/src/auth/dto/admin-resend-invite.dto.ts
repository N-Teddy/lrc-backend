import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminResendInviteDto {
  @ApiProperty({ example: 'person-uuid-here', description: 'Person ID' })
  @IsString()
  personId: string;
}
