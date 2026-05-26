import {
  IsString,
  IsOptional,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    required: false,
    example: 'John Doe',
    description: 'Full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiProperty({
    required: false,
    example: '+237600000000',
    description: 'Phone number',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/pic.jpg',
    description: 'Profile picture URL',
  })
  @IsOptional()
  @IsString()
  picture?: string;
}
