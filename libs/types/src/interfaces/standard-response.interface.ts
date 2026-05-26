import { AppErrorCode } from '../enums/app-error-code.enum';
import { ErrorSeverity } from '../enums/error-severity.enum';

export interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: ResponseMeta;
  error?: AppError;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface AppError {
  code: AppErrorCode | string;
  severity: ErrorSeverity;
  message: string;
  details?: unknown;
}
