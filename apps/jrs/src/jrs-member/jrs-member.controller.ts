import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JrsMemberService } from './jrs-member.service';
import { CreateMemberDto, UpdateMemberDto, MemberFilterDto } from './dto';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '@app/common';
import { JrsRole } from '@app/types';
import type { UserPayload } from '@app/types';

@ApiTags('members')
@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JrsMemberController {
  constructor(private readonly memberService: JrsMemberService) {}

  @Post()
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new JRS member' })
  @ApiResponse({ status: 201, description: 'Member created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  @ApiResponse({ status: 409, description: 'Person is already a member' })
  async create(@Body() dto: CreateMemberDto, @CurrentUser() user: UserPayload) {
    return this.memberService.create(dto, user);
  }

  @Get()
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all JRS members with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of members' })
  async findAll(
    @Query() filters: MemberFilterDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.memberService.findAll(filters, user);
  }

  @Get(':id')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a JRS member by ID' })
  @ApiResponse({ status: 200, description: 'Returns member details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.memberService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a JRS member' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.memberService.update(id, dto, user);
  }

  @Post(':id/archive')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_PC, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a JRS member' })
  @ApiResponse({ status: 200, description: 'Member archived successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async archive(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.memberService.archive(id, user);
  }

  @Patch(':id/promote-pc')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promote member to Personne Contact' })
  @ApiResponse({ status: 200, description: 'Member promoted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async promoteToPc(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.memberService.promoteToPc(id, user);
  }

  @Patch(':id/demote-pc')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demote member from Personne Contact' })
  @ApiResponse({ status: 200, description: 'Member demoted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async demoteFromPc(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.memberService.demoteFromPc(id, user);
  }

  @Patch(':id/promote-ap')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promote member to Accompagnateur Parental' })
  @ApiResponse({ status: 200, description: 'Member promoted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async promoteToAp(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.memberService.promoteToAp(id, user);
  }

  @Patch(':id/demote-ap')
  @Roles(JrsRole.JRS_ADMIN, JrsRole.JRS_AP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demote member from Accompagnateur Parental' })
  @ApiResponse({ status: 200, description: 'Member demoted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async demoteFromAp(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.memberService.demoteFromAp(id, user);
  }
}
