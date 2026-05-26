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
  Header,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import {
  JwtAuthGuard,
  RolesGuard,
  LocationGuard,
  AuthClientService,
} from '@app/common';
import { Roles } from '@app/common';
import { AppCode, AppRole } from '@app/types';
import { UpdateUserDto, PaginationQueryDto } from '../dto/user.dto';
import { IsArray, IsEnum, IsString } from 'class-validator';

class ProvisionUserRequestDto {
  @ApiProperty({ description: 'Person ID to provision' })
  @IsString()
  personId: string;

  @ApiProperty({ enum: AppCode, description: 'App code for the profile' })
  @IsEnum(AppCode)
  appCode: AppCode;

  @ApiProperty({ description: 'Roles to assign', enum: AppRole, isArray: true })
  @IsArray()
  @IsEnum(AppRole, { each: true })
  roles: AppRole[];
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, LocationGuard)
@Roles('SUPER_ADMIN')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly authClient: AuthClientService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: PaginationQueryDto) {
    return await this.userService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      appCode: query.appCode,
      role: query.role,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision a user with roles and send invite' })
  @ApiResponse({ status: 201, description: 'User provisioned successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  provision(
    @Body() dto: ProvisionUserRequestDto,
    @Headers('authorization') authHeader: string,
  ): Promise<unknown> {
    const token = authHeader?.split(' ')[1];
    return this.authClient.provisionUser(
      {
        personId: dto.personId,
        appCode: dto.appCode,
        roles: dto.roles,
      },
      token,
    );
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
