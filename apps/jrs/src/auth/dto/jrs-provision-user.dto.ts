import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppRole } from '@app/types';

export class JrsProvisionUserDto {
  @IsString()
  personId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  roles: AppRole[];
}
