import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
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
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  ConfirmResetDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with credentials for Centre access' })
  @ApiResponse({
    status: 201,
    description: 'Returns access token, refresh token, and user info',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiBody({ type: LoginDto })
  login(@Body() loginDto: LoginDto): Promise<unknown> {
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
  @ApiBody({ type: PasswordResetRequestDto })
  requestReset(@Body() dto: PasswordResetRequestDto): Promise<unknown> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('confirm-reset')
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @ApiBody({ type: ConfirmResetDto })
  confirmReset(@Body() dto: ConfirmResetDto): Promise<unknown> {
    return this.authService.confirmPasswordReset(
      dto.token,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile and roles' })
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
}
