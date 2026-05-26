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
import { ProfileService } from '../services/profile.service';
import { JwtAuthGuard, RolesGuard, LocationGuard } from '@app/common';
import { Roles } from '@app/common';
import {
  AssignProfileDto,
  UpdateProfileDto,
  ProfilePaginationQueryDto,
} from '../dto/profile.dto';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles('SUPER_ADMIN')
export class ProfilesController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all profiles with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of profiles',
  })
  async findAll(@Query() query: ProfilePaginationQueryDto) {
    return await this.profileService.findAll({
      page: query.page,
      limit: query.limit,
      appCode: query.appCode,
      role: query.role,
    });
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profiles by user ID' })
  @ApiResponse({ status: 200, description: 'Returns profiles for user' })
  async findByUser(@Param('userId') userId: string) {
    return this.profileService.findByUser(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({ status: 200, description: 'Returns profile' })
  async findOne(@Param('id') id: string) {
    return this.profileService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  async create(@Body() assignProfileDto: AssignProfileDto) {
    return this.profileService.create(assignProfileDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  async delete(@Param('id') id: string) {
    return this.profileService.delete(id);
  }

  @Post(':id/roles')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to profile' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignRole(
    @Param('id') profileId: string,
    @Body('roleName') roleName: string,
  ) {
    return this.profileService.assignRole(profileId, roleName);
  }

  @Delete(':id/roles/:roleName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove role from profile' })
  @ApiResponse({ status: 200, description: 'Role removed' })
  async removeRole(
    @Param('id') profileId: string,
    @Param('roleName') roleName: string,
  ) {
    return this.profileService.removeRole(profileId, roleName);
  }
}
