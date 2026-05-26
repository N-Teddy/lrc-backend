import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, LocationGuard } from '@app/common';
import { Roles } from '@app/common';
import { PersonService } from '../services/person.service';
import { PersonPaginationQueryDto } from '../dto/person.dto';

@ApiTags('persons')
@Controller('persons')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles('SUPER_ADMIN')
export class PersonsController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all persons with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of persons',
  })
  async findAll(@Query() query: PersonPaginationQueryDto) {
    return await this.personService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      townId: query.townId,
      countryId: query.countryId,
      isArchived: query.isArchived,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get person by ID' })
  @ApiResponse({ status: 200, description: 'Returns person' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  async findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }
}
