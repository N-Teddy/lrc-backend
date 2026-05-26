import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode, ErrorSeverity } from '@app/types';

export class AppException extends HttpException {
  constructor(
    public readonly message: string,
    public readonly errorCode: AppErrorCode | string,
    public readonly severity: ErrorSeverity = ErrorSeverity.ERROR,
    public readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super(
      {
        message,
        code: errorCode,
        severity,
        details,
      },
      httpStatus,
    );
  }

  static unauthorized(
    message = 'Unauthorized access',
    code = AppErrorCode.AUTH_UNAUTHORIZED,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden(
    message = 'Forbidden access',
    code = AppErrorCode.AUTH_FORBIDDEN,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.FORBIDDEN,
    );
  }

  static internal(
    message = 'Internal server error',
    code = AppErrorCode.INTERNAL_SERVER_ERROR,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static badRequest(
    message = 'Bad request',
    code = AppErrorCode.VALIDATION_FAILED,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.BAD_REQUEST,
    );
  }

  static conflict(
    message = 'Conflict',
    code = AppErrorCode.DB_DUPLICATE_ENTRY,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.CONFLICT,
    );
  }

  static notFound(
    message = 'Not found',
    code = AppErrorCode.DB_ENTITY_NOT_FOUND,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.NOT_FOUND,
    );
  }

  static invalid(
    message = 'Invalid request',
    code = AppErrorCode.AUTH_INVALID_CREDENTIALS,
  ) {
    return new AppException(
      message,
      code,
      ErrorSeverity.ERROR,
      HttpStatus.BAD_REQUEST,
    );
  }
}
