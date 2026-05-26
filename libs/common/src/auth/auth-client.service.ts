import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../filters/app-exception';
import { AppErrorCode, AppCode, AppRole } from '@app/types';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  isFirstLogin?: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface PasswordResetResponse {
  message: string;
}

interface ConfirmResetResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface AcceptInviteResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ProvisionResponse {
  userId: string;
}

interface UserExistsResponse {
  message: string;
}

interface ResendInviteResponse {
  userId: string;
}

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get authServiceUrl(): string {
    return this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  async login(email: string, password: string, appCode?: string) {
    try {
      const response = await firstValueFrom<{ data: LoginResponse }>(
        this.httpService.post(`${this.authServiceUrl}/api/v1/auth/login`, {
          email,
          pass: password,
          appCode,
        }),
      );
      const outer = response.data as any;
      const payload =
        outer && outer.success && outer.meta && outer.data != null
          ? outer.data
          : outer;
      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        user: payload.user,
        isFirstLogin: payload.isFirstLogin,
      };
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Auth-service login failed',
        (error as { response?: { data?: unknown } }).response?.data,
      );
      throw AppException.unauthorized(
        'Invalid credentials',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const response = await firstValueFrom<{ data: TokenResponse }>(
        this.httpService.post(`${this.authServiceUrl}/api/v1/auth/refresh`, {
          refreshToken,
        }),
      );
      const outer = response.data as any;
      const payload =
        outer && typeof outer === 'object' && 'access_token' in outer
          ? outer
          : outer && outer.success && outer.meta && outer.data != null
            ? outer.data
            : outer;
      const accessToken = (payload as TokenResponse)['access_token'];
      if (!accessToken) {
        throw AppException.unauthorized(
          'Invalid refresh token',
          AppErrorCode.AUTH_INVALID_CREDENTIALS,
        );
      }
      return { accessToken };
    } catch (error: unknown) {
      this.logger.error(
        'Auth-service refresh failed',
        (error as { response?: { data?: unknown } }).response?.data,
      );
      throw AppException.unauthorized(
        'Invalid refresh token',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const response = await firstValueFrom<{ data: PasswordResetResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/request-reset`,
          { email },
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      return (hasWrapper ? outer.data : outer) as PasswordResetResponse;
    } catch (error: unknown) {
      this.logger.error(
        'Password reset request failed',
        (error as { response?: { data?: unknown } }).response?.data,
      );
      return {
        message:
          'If an account exists with this email, a reset link will be sent.',
      };
    }
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    try {
      const response = await firstValueFrom<{ data: ConfirmResetResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/confirm-reset`,
          { token, newPassword, confirmPassword },
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      const inner = hasWrapper
        ? (outer.data as unknown as ConfirmResetResponse)
        : (outer as ConfirmResetResponse);
      return {
        accessToken: inner.access_token,
        refreshToken: inner.refresh_token,
        user: inner.user,
      };
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Password reset confirmation failed',
        (
          error as {
            response?: {
              data?: { message?: string; error?: { code?: AppErrorCode } };
            };
          }
        ).response?.data,
      );
      const responseData = (
        error as {
          response?: {
            data?: { message?: string; error?: { code?: AppErrorCode } };
          };
        }
      ).response?.data;
      const message = responseData?.message || 'Invalid or expired reset token';
      const code =
        responseData?.error?.code || AppErrorCode.AUTH_INVALID_CREDENTIALS;
      throw AppException.badRequest(message, code);
    }
  }

  async acceptInvite(dto: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    try {
      const response = await firstValueFrom<{ data: AcceptInviteResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/accept-invite`,
          dto,
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      return (hasWrapper ? outer.data : outer) as AcceptInviteResponse;
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Auth-service accept invite failed',
        (
          error as {
            response?: {
              data?: { message?: string; error?: { code?: AppErrorCode } };
            };
          }
        ).response?.data,
      );
      const responseData = (
        error as {
          response?: {
            data?: { message?: string; error?: { code?: AppErrorCode } };
          };
        }
      ).response?.data;
      const message = responseData?.message || 'Accept invite failed';
      const code =
        responseData?.error?.code || AppErrorCode.AUTH_INVALID_CREDENTIALS;
      if (
        (error as { response?: { status?: number } }).response?.status ===
          400 ||
        (error as { response?: { status?: number } }).response?.status ===
          401 ||
        (error as { response?: { status?: number } }).response?.status === 403
      ) {
        throw AppException.badRequest(message, code);
      }
      throw AppException.internal(message);
    }
  }

  async provisionUser(
    dto: {
      personId: string;
      appCode: AppCode;
      roles: AppRole[];
    },
    token?: string,
  ) {
    try {
      const response = await firstValueFrom<{ data: ProvisionResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/provision`,
          dto,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        ),
      );
      const outerProv = response.data as any;
      const hasWrapperProv = 'success' in outerProv && 'meta' in outerProv;
      return (hasWrapperProv ? outerProv.data : outerProv) as ProvisionResponse;
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Failed to provision user',
        (error as { response?: { data?: { message?: string } } }).response
          ?.data,
      );
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 404) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.notFound(
          responseData?.message || 'Person not found',
          AppErrorCode.DB_ENTITY_NOT_FOUND,
        );
      }
      if (status === 400) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.badRequest(
          responseData?.message || 'Validation failed',
          AppErrorCode.VALIDATION_FAILED,
        );
      }
      if (status === 409) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.conflict(
          responseData?.message || 'User already exists',
          AppErrorCode.DB_DUPLICATE_ENTRY,
        );
      }
      throw AppException.internal('Failed to provision user');
    }
  }

  async resendInvite(
    dto: { personId: string; appCode: AppCode },
    token?: string,
  ) {
    try {
      const response = await firstValueFrom<{ data: ResendInviteResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/resend-invite`,
          dto,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      return (hasWrapper ? outer.data : outer) as ResendInviteResponse;
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Failed to resend invite',
        (error as { response?: { data?: { message?: string } } }).response
          ?.data,
      );
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 404) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.notFound(
          responseData?.message || 'User or profile not found',
          AppErrorCode.DB_ENTITY_NOT_FOUND,
        );
      }
      throw AppException.internal('Failed to resend invite');
    }
  }

  async assignRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: string[];
  }) {
    try {
      const response = await firstValueFrom<{ data: UserExistsResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/assign-roles`,
          dto,
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      return (hasWrapper ? outer.data : outer) as UserExistsResponse;
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Failed to assign roles',
        (error as { response?: { data?: { message?: string } } }).response
          ?.data,
      );
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 404) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.notFound(
          responseData?.message || 'User or profile not found',
          AppErrorCode.DB_ENTITY_NOT_FOUND,
        );
      }
      throw AppException.internal('Failed to assign roles');
    }
  }

  async removeRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: string[];
  }) {
    try {
      const response = await firstValueFrom<{ data: UserExistsResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/auth/remove-roles`,
          dto,
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      return (hasWrapper ? outer.data : outer) as UserExistsResponse;
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Failed to remove roles',
        (error as { response?: { data?: { message?: string } } }).response
          ?.data,
      );
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 404) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.notFound(
          responseData?.message || 'User or profile not found',
          AppErrorCode.DB_ENTITY_NOT_FOUND,
        );
      }
      throw AppException.internal('Failed to remove roles');
    }
  }

  async deactivateProfile(dto: { personId: string; appCode: AppCode }) {
    try {
      const response = await firstValueFrom<{ data: UserExistsResponse }>(
        this.httpService.post(
          `${this.authServiceUrl}/api/v1/autH/deactivate-profile`,
          dto,
        ),
      );
      const outer = response.data as any;
      const hasWrapper = 'success' in outer && 'meta' in outer;
      return (hasWrapper ? outer.data : outer) as UserExistsResponse;
    } catch (error: unknown) {
      if (error instanceof AppException) throw error;
      this.logger.error(
        'Failed to deactivate profile',
        (error as { response?: { data?: { message?: string } } }).response
          ?.data,
      );
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 404) {
        const responseData = (
          error as { response?: { data?: { message?: string } } }
        ).response?.data;
        throw AppException.notFound(
          responseData?.message || 'User or profile not found',
          AppErrorCode.DB_ENTITY_NOT_FOUND,
        );
      }
      throw AppException.internal('Failed to deactivate profile');
    }
  }
}
