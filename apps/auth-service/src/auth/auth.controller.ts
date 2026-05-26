import { Controller, Post, Body, UseGuards, Get, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public, JwtAuthGuard, CurrentUser, AppException } from '@app/common';
import { AppCode, AppErrorCode } from '@app/types';
import {
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  ConfirmResetDto,
  UpdateProfileDto,
  ChangePasswordDto,
  AcceptInviteDto,
  ProvisionUserDto,
  ResendInviteDto,
} from './dto';
import type { UserPayload } from '@app/types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 201,
    description: 'Returns access and refresh tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.pass,
    );
    const appCode = loginDto.appCode ?? AppCode.AUTH;
    return this.authService.login(user, appCode);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 201,
    description: 'Returns new access and refresh tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Public()
  @Post('request-reset')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 201,
    description: 'Reset email sent (if user exists)',
  })
  async requestReset(@Body() dto: PasswordResetRequestDto) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message:
        'If an account exists with this email, a reset link will be sent.',
    };
  }

  @Public()
  @Post('confirm-reset')
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmReset(@Body() dto: ConfirmResetDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw AppException.badRequest(
        'New passwords do not match',
        AppErrorCode.VALIDATION_FAILED,
      );
    }
    return this.authService.confirmPasswordReset(dto.token, dto.newPassword);
  }

  @Public()
  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept invitation and set password' })
  @ApiResponse({ status: 201, description: 'Invite accepted, tokens returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(
      dto.token,
      dto.newPassword,
      dto.confirmPassword,
      dto.appCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: UserPayload) {
    return this.authService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid old password',
  })
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('provision')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision a new user' })
  @ApiResponse({ status: 201, description: 'User provisioned successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  async provision(
    @CurrentUser() vuser: UserPayload,
    @Body() dto: ProvisionUserDto,
  ) {
    console.log('called');
    return this.authService.provisionUser({
      personId: dto.personId,
      appCode: dto.appCode,
      roles: dto.roles,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-invite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend invite' })
  @ApiResponse({ status: 200, description: 'Invite resent successfully' })
  @ApiResponse({ status: 404, description: 'User or profile not found' })
  async resendInvite(
    @CurrentUser() user: UserPayload,
    @Body() dto: ResendInviteDto,
  ) {
    return this.authService.resendInvite(dto);
  }
}
