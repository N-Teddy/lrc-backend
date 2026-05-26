import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', minLength: 200 })
  @IsString()
  @MinLength(200) // JWTs are typically long
  refreshToken: string;
}
