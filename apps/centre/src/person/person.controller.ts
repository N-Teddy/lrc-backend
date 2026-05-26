import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, LocationGuard } from '@app/common';
import { Roles } from '@app/common';
import { AppRole } from '@app/types';
import { PersonService } from './person.service';
import { CreatePersonDto, UpdatePersonDto } from './dto/create-person.dto';

@ApiTags('persons')
@Controller('persons')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles(AppRole.CENTRE_CHEF)
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a new person (auto-assigned to creator's town)",
  })
  @ApiResponse({ status: 201, description: 'Person created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createPersonDto: CreatePersonDto, @Req() req) {
    return this.personService.create(createPersonDto, {
      townId: req.user.townId,
      countryId: req.user.countryId,
    });
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all persons for the current town' })
  @ApiResponse({ status: 200, description: 'Returns list of persons' })
  async findAll(@Req() req) {
    return this.personService.findAll({
      townId: req.user.townId,
      countryId: req.user.countryId,
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

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update person' })
  @ApiResponse({ status: 200, description: 'Person updated' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    return this.personService.update(id, updatePersonDto);
  }
}
