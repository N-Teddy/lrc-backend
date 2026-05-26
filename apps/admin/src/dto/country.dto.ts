import { IsString, MinLength, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CountryPaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default: 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (default: 10, max: 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'Cameroon',
    description: 'Search by country name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateCountryDto {
  @ApiProperty({ example: 'Cameroon', description: 'Country name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'CM', description: 'Country code (2 letters)' })
  @IsString()
  @MinLength(2)
  code: string;

  @ApiProperty({ example: '+237', description: 'Phone code' })
  @IsString()
  @MinLength(3)
  phoneCode: string;
}

export class UpdateCountryDto {
  @ApiProperty({
    required: false,
    example: 'Cameroon',
    description: 'Country name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ required: false, example: 'CM', description: 'Country code' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @ApiProperty({ required: false, example: '+237', description: 'Phone code' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  phoneCode?: string;
}
