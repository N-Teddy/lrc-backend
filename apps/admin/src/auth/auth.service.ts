import { Injectable, Logger } from '@nestjs/common';
import { AuthClientService } from '@app/common';
import { AppCode, AppRole } from '@app/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly authClient: AuthClientService) {}

  login(email: string, password: string): Promise<unknown> {
    return this.authClient.login(email, password, AppCode.ADMIN);
  }

  refreshToken(refreshToken: string): Promise<unknown> {
    return this.authClient.refreshToken(refreshToken);
  }

  provisionUser(
    dto: { personId: string; roles: AppRole[] },
    token?: string,
  ): Promise<unknown> {
    return this.authClient.provisionUser(
      {
        personId: dto.personId,
        appCode: AppCode.ADMIN,
        roles: dto.roles,
      },
      token,
    );
  }

  resendInvite(dto: { personId: string }, token?: string): Promise<unknown> {
    return this.authClient.resendInvite(
      {
        personId: dto.personId,
        appCode: AppCode.ADMIN,
      },
      token,
    );
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

  assignRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: string[];
  }): Promise<unknown> {
    return this.authClient.assignRoles(dto);
  }

  removeRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: string[];
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
