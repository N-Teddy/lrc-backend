import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Public, CurrentUser } from '@app/common';
import type { UserPayload } from '@app/types';
import {
  AdminLoginDto,
  RefreshTokenDto,
  AdminPasswordResetRequestDto,
  AdminConfirmResetDto,
  AdminProvisionUserDto,
  AdminResendInviteDto,
  AdminAcceptInviteDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with admin credentials' })
  @ApiResponse({
    status: 201,
    description: 'Returns access token, refresh token, and user info',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiBody({ type: AdminLoginDto })
  login(@Body() loginDto: AdminLoginDto): Promise<unknown> {
    return this.authService.login(loginDto.email, loginDto.pass);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh an expired access token' })
  @ApiResponse({
    status: 201,
    description: 'Returns new access and refresh tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  refresh(@Body() dto: RefreshTokenDto): Promise<unknown> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Public()
  @Post('request-reset')
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'If an account with the given email exists, a password reset link will be sent.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reset email sent (if user exists)',
  })
  @ApiBody({ type: AdminPasswordResetRequestDto })
  requestReset(@Body() dto: AdminPasswordResetRequestDto): Promise<unknown> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('confirm-reset')
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @ApiBody({ type: AdminConfirmResetDto })
  confirmReset(@Body() dto: AdminConfirmResetDto): Promise<unknown> {
    return this.authService.confirmPasswordReset(
      dto.token,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated admin profile' })
  @ApiResponse({ status: 200, description: 'Returns admin profile and roles' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — invalid or expired token',
  })
  getProfile(@CurrentUser() user: UserPayload): unknown {
    return {
      id: user.sub,
      personId: user.personId,
      email: user.email,
      townId: user.townId,
      countryId: user.countryId,
      profiles: user.profiles,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('provision')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision a new user for ADMIN app' })
  @ApiResponse({ status: 201, description: 'User provisioned successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  @ApiBody({ type: AdminProvisionUserDto })
  provision(
    @Body() dto: AdminProvisionUserDto,
    @Headers('authorization') authHeader: string,
  ): Promise<unknown> {
    const token = authHeader?.split(' ')[1];
    return this.authService.provisionUser(
      {
        personId: dto.personId,
        roles: dto.roles,
      },
      token,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-invite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend invitation email' })
  @ApiResponse({ status: 200, description: 'Invite resent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ type: AdminResendInviteDto })
  resendInvite(
    @Body() dto: AdminResendInviteDto,
    @Headers('authorization') authHeader: string,
  ): Promise<unknown> {
    const token = authHeader?.split(' ')[1];
    return this.authService.resendInvite(dto, token);
  }

  @Public()
  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept invitation and set password' })
  @ApiResponse({ status: 201, description: 'Invite accepted, tokens returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiBody({ type: AdminAcceptInviteDto })
  acceptInvite(@Body() dto: AdminAcceptInviteDto): Promise<unknown> {
    return this.authService.acceptInvite(dto);
  }
}
