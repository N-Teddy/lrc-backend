import { Injectable, Logger } from '@nestjs/common';
import { AuthClientService } from '@app/common';
import { AppCode, AppRole } from '@app/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly authClient: AuthClientService) {}

  login(email: string, password: string, appCode?: string): Promise<unknown> {
    return this.authClient.login(email, password, appCode || AppCode.JRS);
  }

  refreshToken(refreshToken: string): Promise<unknown> {
    return this.authClient.refreshToken(refreshToken);
  }

  provisionUser(dto: { personId: string; roles: AppRole[] }): Promise<unknown> {
    return this.authClient.provisionUser({
      personId: dto.personId,
      appCode: AppCode.JRS,
      roles: dto.roles,
    });
  }

  resendInvite(dto: { personId: string }): Promise<unknown> {
    return this.authClient.resendInvite({
      personId: dto.personId,
      appCode: AppCode.JRS,
    });
  }

  acceptInvite(dto: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<unknown> {
    return this.authClient.acceptInvite(dto);
  }

  requestPasswordReset(email: string): Promise<unknown> {
    return this.authClient.requestPasswordReset(email);
  }

  confirmPasswordReset(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<unknown> {
    return this.authClient.confirmPasswordReset(
      token,
      newPassword,
      confirmPassword,
    );
  }

  createUserWithProfile(dto: {
    personId: string;
    appCode: AppCode;
    roles?: AppRole[];
    password?: string;
  }): Promise<unknown> {
    return this.authClient.provisionUser({
      personId: dto.personId,
      appCode: dto.appCode,
      roles: dto.roles || [],
    });
  }

  assignRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: AppRole[];
  }): Promise<unknown> {
    return this.authClient.assignRoles(dto);
  }

  removeRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: AppRole[];
  }): Promise<unknown> {
    return this.authClient.removeRoles(dto);
  }

  deactivateProfile(dto: {
    personId: string;
    appCode: AppCode;
  }): Promise<unknown> {
    return this.authClient.deactivateProfile(dto);
  }
}
