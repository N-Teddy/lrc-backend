import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
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
import { CreateRoleDto } from '../';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles('SUPER_ADMIN')
export class RolesController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to profile' })
  @ApiResponse({ status: 201, description: 'Role assigned' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.profileService.assignRole(
      createRoleDto.appProfileId,
      createRoleDto.roleName,
    );
  }

  @Delete(':profileId/roles/:roleName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove role from profile' })
  @ApiResponse({ status: 200, description: 'Role removed' })
  async deleteRole(
    @Param('profileId') profileId: string,
    @Param('roleName') roleName: string,
  ) {
    return this.profileService.removeRole(profileId, roleName);
  }
}
