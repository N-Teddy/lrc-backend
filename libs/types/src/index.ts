/// <reference types="express" />

import { AppCode } from './enums/app-code.enum';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        personId: string;
        email: string;
        townId: string;
        countryId: string;
        profiles: {
          app: AppCode;
          roles: string[];
        }[];
      };
    }
  }
}

// Enums
export * from './enums/app-error-code.enum';
export * from './enums/audit-action.enum';
export * from './enums/error-severity.enum';
export * from './enums/identity.enum';
export * from './enums/app-code.enum';
export * from './enums/jrs.enum';
export * from './enums/centre.enum';
export * from './enums/jeunes.enum';
export * from './enums/notification-channel.enum';
export * from './enums/notification-status.enum';
export * from './enums/notification-type.enum';
export * from './enums/notification-priority.enum';
export * from './enums/app-role.enum';

// Interfaces
export * from './interfaces/standard-response.interface';
export * from './interfaces/user-payload.interface';
export * from './interfaces/notification-payload.interface';
export * from './interfaces/pagination.interface';
