import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserContextService } from '../context/user-context.service';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly userContext: UserContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const userId = (req.user as { sub?: string } | undefined)?.sub || 'system';

    this.userContext.run(userId, () => {
      next();
    });
  }
}
