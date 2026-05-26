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
import { TownService } from '../services/town.service';
import { JwtAuthGuard, RolesGuard, LocationGuard } from '@app/common';
import { Roles } from '@app/common';
import {
  CreateTownDto,
  UpdateTownDto,
  TownPaginationQueryDto,
} from '../dto/town.dto';

@ApiTags('towns')
@Controller('towns')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles('SUPER_ADMIN')
export class TownsController {
  constructor(private readonly townService: TownService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all towns with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of towns' })
  async findAll(@Query() query: TownPaginationQueryDto) {
    return await this.townService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      countryId: query.countryId,
    });
  }

  @Get('country/:countryId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get towns by country' })
  @ApiResponse({ status: 200, description: 'Returns towns for country' })
  async findByCountry(@Param('countryId') countryId: string) {
    return this.townService.findByCountry(countryId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get town by ID' })
  @ApiResponse({ status: 200, description: 'Returns town' })
  @ApiResponse({ status: 404, description: 'Town not found' })
  async findOne(@Param('id') id: string) {
    return this.townService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new town' })
  @ApiResponse({ status: 201, description: 'Town created' })
  async create(@Body() createTownDto: CreateTownDto) {
    return this.townService.create(createTownDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update town' })
  @ApiResponse({ status: 200, description: 'Town updated' })
  async update(@Param('id') id: string, @Body() updateTownDto: UpdateTownDto) {
    return this.townService.update(id, updateTownDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete town' })
  @ApiResponse({ status: 200, description: 'Town deleted' })
  async delete(@Param('id') id: string) {
    return this.townService.delete(id);
  }
}
