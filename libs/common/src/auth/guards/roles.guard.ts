import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppCode } from '@app/types';
import { AppException } from '../../filters/app-exception';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<Request>().user as
      | { profiles?: { app: AppCode; roles: string[] }[] }
      | undefined;

    if (!user || !user.profiles) {
      throw AppException.forbidden(
        'Access denied: No profile found for this user',
      );
    }

    const currentApp = this.configService.get<AppCode>('APP_CODE');

    // 1. Check for System Admin bypass (usually handled via a specific app/role)
    const adminProfile = user.profiles.find((p) => p.app === AppCode.ADMIN);
    if (adminProfile?.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    // 2. Find profile for the current application
    const appProfile = user.profiles.find((p) => p.app === currentApp);

    if (!appProfile) {
      throw AppException.forbidden(
        `Access denied: User does not have a profile for ${currentApp}`,
      );
    }

    const hasRole = requiredRoles.some((role) =>
      appProfile.roles.includes(role),
    );

    if (!hasRole) {
      throw AppException.forbidden(
        `Access denied: Missing required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
