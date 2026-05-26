import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppErrorCode, ErrorSeverity, StandardResponse } from '@app/types';
import { SystemLogService } from '../audit/system-log.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface ExceptionResponseBody {
  message?: string | string[];
  code?: AppErrorCode | string;
  severity?: ErrorSeverity;
  details?: unknown;
}

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly systemLogService: SystemLogService,
    private readonly configService: ConfigService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = AppErrorCode.INTERNAL_SERVER_ERROR;
    let severity = ErrorSeverity.ERROR;
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = (exception.getResponse() as ExceptionResponseBody) || {};

      message =
        typeof res.message === 'string' ? res.message : exception.message;

      if (status === HttpStatus.BAD_REQUEST && Array.isArray(res.message)) {
        code = AppErrorCode.VALIDATION_FAILED;
        details = res.message;
      }

      if (res.code) code = res.code as AppErrorCode;
      if (res.severity) severity = res.severity;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error using standard Winston logger
    this.logger.error(
      `${request.method} ${request.url} failed: ${message}`,
      (exception as Error).stack,
    );

    // Save to Database System Logs
    const serviceName = this.configService.get<string>('APP_NAME') || 'unknown';
    await this.systemLogService.create(
      severity.toLowerCase(),
      message,
      AllExceptionsFilter.name,
      serviceName,
      {
        path: request.url,
        method: request.method,
        code,
        stack: exception instanceof Error ? exception.stack : null,
      },
    );

    const errorResponse: StandardResponse = {
      success: false,
      error: {
        code,
        severity,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (request.headers['x-request-id'] as string) || 'unknown',
      },
    };

    response.status(status).json(errorResponse);
  }
}
