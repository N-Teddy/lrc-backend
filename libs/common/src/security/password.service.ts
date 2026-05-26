import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly defaultOptions: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
  };

  hash(plainPassword: string, options?: argon2.Options): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    return argon2.hash(plainPassword, opts);
  }

  verify(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }

  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash);
  }
}
