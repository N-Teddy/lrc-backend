import { AppCode } from '../enums/app-code.enum';

export interface UserPayload {
  sub: string; // userId
  personId: string;
  email: string;
  townId: string;
  countryId: string;
  profiles: {
    app: AppCode;
    roles: string[];
  }[];
}
