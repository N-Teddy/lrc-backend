import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@app/types';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (
    data: keyof UserPayload | undefined,
    ctx: ExecutionContext,
  ): UserPayload | UserPayload[keyof UserPayload] | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
