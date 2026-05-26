declare module 'passport-jwt' {
  import { Strategy as PassportStrategy } from 'passport';

  interface ExtractJwt {
    fromAuthHeaderWithScheme(authScheme: string): AuthHandler;
    fromAuthHeaderAsBearerToken(): AuthHandler;
    fromAuthHeader(): AuthHandler;
    fromUrlQueryParameter(paramName: string): AuthHandler;
    fromBodyField(fieldName: string): AuthHandler;
    fromExtractors(extractors: AuthHandler[]): AuthHandler;
  }

  interface JwtStrategyOptions {
    secretOrKey?: string | Buffer;
    secretOrKeyProvider?: (
      request: unknown,
      rawJwt: string,
      done: (err?: Error | null, secret?: string | Buffer) => void,
    ) => void;
    jwtFromRequest: AuthHandler;
    issuer?: string;
    audience?: string;
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
  }

  interface JwtVerifierOptions {
    algorithms?: string[];
    clockTolerance?: number;
    ignoreExpiration?: boolean;
    maxAge?: string;
    ignoreNotBefore?: boolean;
    nonce?: boolean;
    cache?: boolean;
  }

  interface VerifyCallback {
    (err?: Error, user?: unknown, info?: unknown): void;
  }

  interface StrategyStatic {
    new (options: JwtStrategyOptions, verify: VerifyCallback): PassportStrategy;
    JwtVerifier: (token: string, secretOrKey: string | Buffer, options?: JwtVerifierOptions, callback?: VerifyCallback) => void;
  }

  const ExtractJwt: ExtractJwt;
  const Strategy: StrategyStatic;

  export { ExtractJwt, Strategy };
}
