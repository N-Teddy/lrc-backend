import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StandardResponse } from '@app/types';
import type { Request } from 'express';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data): StandardResponse<T> => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data as StandardResponse<T>;
        }

        const paginated = this.detectPaginatedData(data);
        if (paginated) {
          const { items, meta } = paginated;
          return {
            success: true,
            data: items as unknown as T,
            meta: {
              timestamp: new Date().toISOString(),
              requestId:
                (request.headers['x-request-id'] as string) || 'unknown',
              ...meta,
            },
          };
        }

        return {
          success: true,
          data: data as T,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: (request.headers['x-request-id'] as string) || 'unknown',
          },
        };
      }),
    );
  }

  private detectPaginatedData(
    data: unknown,
  ): { items: unknown[]; meta: PaginationMeta } | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const obj = data as Record<string, unknown>;

    // Pattern 0: Canonical format { items, pagination }
    if (
      'items' in obj &&
      'pagination' in obj &&
      typeof obj.pagination === 'object'
    ) {
      const pagination = obj.pagination as Record<string, unknown>;
      return {
        items: Array.isArray(obj.items) ? obj.items : [],
        meta: this.buildPaginationMeta(pagination),
      };
    }

    // Pattern 1: Admin format { results, total, page, limit }
    if ('results' in obj && 'total' in obj && 'page' in obj && 'limit' in obj) {
      return {
        items: Array.isArray(obj.results) ? obj.results : [],
        meta: this.buildPaginationMeta(obj),
      };
    }

    // Pattern 2: JRS/Legacy format { collectionKey: array, total, page, limit }
    const knownCollectionKeys = [
      'members',
      'users',
      'profiles',
      'entities',
      'records',
      'data',
    ];
    const collectionKey = knownCollectionKeys.find((k) =>
      Array.isArray(obj[k]),
    );

    if (collectionKey && 'total' in obj && 'page' in obj && 'limit' in obj) {
      return {
        items: obj[collectionKey] as unknown[],
        meta: this.buildPaginationMeta(obj),
      };
    }

    return null;
  }

  private buildPaginationMeta(obj: Record<string, unknown>): PaginationMeta {
    const total = typeof obj.total === 'number' ? obj.total : 0;
    const limit = typeof obj.limit === 'number' ? obj.limit : 20;
    return {
      total,
      page: typeof obj.page === 'number' ? obj.page : 1,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
