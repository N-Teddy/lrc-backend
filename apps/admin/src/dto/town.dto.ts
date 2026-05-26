import {
  IsString,
  MinLength,
  IsUUID,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TownPaginationQueryDto {
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
    example: 'Douala',
    description: 'Search by town name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '1622bc87-f0b0-408d-a065-5d3e7ca04e86',
    description: 'Filter by country ID',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}

export class CreateTownDto {
  @ApiProperty({ example: 'Douala', description: 'Town name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'uuid-country-id', description: 'Country ID' })
  @IsUUID()
  countryId: string;
}

export class UpdateTownDto {
  @ApiProperty({ required: false, example: 'Douala', description: 'Town name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    required: false,
    example: 'uuid-country-id',
    description: 'Country ID',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}
