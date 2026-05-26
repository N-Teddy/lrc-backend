import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CountryService } from '../services/country.service';
import { JwtAuthGuard, RolesGuard, LocationGuard } from '@app/common';
import { Roles } from '@app/common';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryPaginationQueryDto,
} from '../dto/country.dto';

@ApiTags('countries')
@Controller('countries')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles('SUPER_ADMIN')
export class CountriesController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all countries with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of countries',
  })
  async findAll(@Query() query: CountryPaginationQueryDto) {
    return await this.countryService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiResponse({ status: 200, description: 'Returns country' })
  async findOne(@Param('id') id: string) {
    return this.countryService.findOne(id);
  }

  @Get('code/:code')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get country by code' })
  @ApiResponse({ status: 200, description: 'Returns country' })
  async findByCode(@Param('code') code: string) {
    return this.countryService.findByCode(code);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new country' })
  @ApiResponse({ status: 201, description: 'Country created' })
  async create(@Body() createCountryDto: CreateCountryDto) {
    return this.countryService.create(createCountryDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update country' })
  @ApiResponse({ status: 200, description: 'Country updated' })
  async update(
    @Param('id') id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ) {
    return this.countryService.update(id, updateCountryDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete country' })
  @ApiResponse({ status: 200, description: 'Country deleted' })
  async delete(@Param('id') id: string) {
    return this.countryService.delete(id);
  }
}
