import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserPayload, AppCode } from '@app/types';
import { AppException } from '../../filters/app-exception';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class LocationGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    if (!user) return true;

    const currentApp = this.configService.get<AppCode>('APP_CODE');

    // 1. Bypass for System Admins (SUPER_ADMIN in ADMIN app)
    const isSystemAdmin = user.profiles.some(
      (p) =>
        (p.app as string) === String(AppCode.ADMIN) &&
        p.roles.includes('SUPER_ADMIN'),
    );
    if (isSystemAdmin) return true;

    // 2. Bypass for App Admins
    const isAppAdmin = user.profiles.some(
      (p) =>
        (p.app as string) === String(currentApp) &&
        p.roles.some((r) => r.endsWith('_ADMIN')),
    );
    if (isAppAdmin) return true;

    const reqParams = request.params as Record<string, unknown>;

    const reqBody = request.body as Record<string, unknown>;

    const reqQuery = request.query as Record<string, unknown>;

    const resourceTownId =
      (reqParams.townId as string | undefined) ||
      (reqBody.townId as string | undefined) ||
      (reqQuery.townId as string | undefined);
    const resourceCountryId =
      (reqParams.countryId as string | undefined) ||
      (reqBody.countryId as string | undefined) ||
      (reqQuery.countryId as string | undefined);

    if (!resourceTownId && !resourceCountryId) {
      return true;
    }

    if (resourceCountryId && resourceCountryId !== user.countryId) {
      throw AppException.forbidden(
        'Access denied: You cannot access data from a different country',
      );
    }

    if (resourceTownId && resourceTownId !== user.townId) {
      if (request.method !== 'GET') {
        throw AppException.forbidden(
          'Access denied: You only have view access to data from other towns',
        );
      }
    }

    return true;
  }
}
