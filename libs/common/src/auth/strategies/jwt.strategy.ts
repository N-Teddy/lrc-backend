import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '@app/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: (req: any) => {
        let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token) {
          // Strip accidental quotes (common frontend localStorage bug) and whitespace
          token = token.replace(/^["']|["']$/g, '').trim();
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: {
    sub: string;
    personId: string;
    email: string;
    townId: string;
    countryId: string;
    profiles: Array<{ app: string; roles: string[] }>;
  }): UserPayload {
    return {
      sub: payload.sub,
      personId: payload.personId,
      email: payload.email,
      townId: payload.townId,
      countryId: payload.countryId,
      profiles: payload.profiles as UserPayload['profiles'],
    };
  }
}
