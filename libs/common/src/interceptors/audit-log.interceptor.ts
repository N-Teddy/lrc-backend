import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditActionEnum } from '@app/types';
import { GlobalConfigService } from '../config/global-config.service';
import type { Request } from 'express';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly config: GlobalConfigService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;

    const body: unknown = request.body;

    const headers: Record<string, unknown> = request.headers;
    const ip: string | undefined =
      (request as { ip?: string | null }).ip ?? undefined;

    const user = request.user;

    // 1. Filter out noise (GET requests & Health checks)
    if (method === 'GET' || url.includes('/health') || url.includes('/docs')) {
      return next.handle();
    }

    // 2. Skip sensitive routes (Login/Register) to avoid logging passwords
    const skipRoutes = ['/auth/login', '/v1/auth/login', '/auth/register'];
    if (skipRoutes.some((route) => url.includes(route))) {
      this.logger.debug(`Skipping detailed audit for sensitive route: ${url}`);
      return next.handle();
    }

    // 3. Identification

    const serviceName = String(
      this.config.getValue('APP_NAME', false) ?? 'unknown-service',
    );

    return next.handle().pipe(
      tap({
        next: () => {
          void this.createAuditLog(
            request,
            user,
            method,
            url,
            body,
            headers,
            ip ?? undefined,
            serviceName,
          );
        },
        error: (error: unknown) => {
          this.logger.warn(
            `Failed request: ${method} ${url} - ${(error as Error).message}`,
          );
        },
      }),
    );
  }

  private async createAuditLog(
    _request: Request,
    user: unknown,
    method: string,
    url: string,
    body: unknown,
    headers: Record<string, unknown>,
    ip: string | undefined,
    serviceName: string,
  ) {
    try {
      const entity = this.extractEntityFromUrl(url);
      const action = this.determineAction(method, url);

      await this.auditLogService.createAuditLog({
        userId: (user as { sub?: string })?.sub || 'system',
        action,
        entity,
        route: url,
        method,
        requestBody: this.filterSensitiveData(body),
        requestHeaders: this.filterSensitiveHeaders(headers),
        ipAddress: ip,
        userAgent: headers['user-agent'] as string | undefined,
        serviceName,
      });

      this.logger.debug(
        `Audit log created: ${action} on ${entity} by user ${(user as { sub?: string })?.sub || 'system'}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create audit log: ${(error as Error).message}`,
      );
    }
  }

  private extractEntityFromUrl(url: string): string {
    const matches =
      url.match(/\/api\/v\d+\/([^/]+)/) || url.match(/\/api\/([^/]+)/);
    return matches ? matches[1] : 'unknown';
  }

  private determineAction(method: string, url: string): AuditActionEnum {
    if (method === 'POST') return AuditActionEnum.CREATE;
    if (['PUT', 'PATCH'].includes(method)) return AuditActionEnum.UPDATE;
    if (method === 'DELETE') return AuditActionEnum.DELETE;
    if (url.includes('/login')) return AuditActionEnum.LOGIN;
    if (url.includes('/register')) return AuditActionEnum.REGISTER;
    return AuditActionEnum.OTHER;
  }

  private filterSensitiveHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitive = ['authorization', 'cookie', 'x-api-key'];
    const filtered = { ...headers } as Record<string, unknown>;
    sensitive.forEach((h) => {
      if (filtered[h]) filtered[h] = '[REDACTED]';
    });
    return filtered;
  }

  private filterSensitiveData(
    data: unknown,
  ): Record<string, unknown> | undefined {
    if (
      !data ||
      typeof data !== 'object' ||
      data === null ||
      Array.isArray(data)
    ) {
      return undefined;
    }
    const sensitive = ['password', 'token', 'secret', 'creditCard'];
    const filtered = { ...(data as Record<string, unknown>) };
    sensitive.forEach((s) => {
      if (filtered[s]) filtered[s] = '[REDACTED]';
    });
    return filtered;
  }
}
