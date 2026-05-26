import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocketAdminConfig {
  private readonly isEnabled: boolean;
  private readonly username: string;
  private readonly password: string;
  private readonly path: string;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled = this.configService.get<boolean>(
      'SOCKET_ADMIN_ENABLED',
      process.env.NODE_ENV !== 'production',
    );
    this.username = this.configService.get<string>(
      'SOCKET_ADMIN_USERNAME',
      'admin',
    );
    this.password = this.configService.get<string>(
      'SOCKET_ADMIN_PASSWORD',
      'admin',
    );
    this.path = this.configService.get<string>('SOCKET_ADMIN_PATH', '/admin');
  }

  get enabled(): boolean {
    return this.isEnabled;
  }

  get auth(): { username: string; password: string } {
    return {
      username: this.username,
      password: this.password,
    };
  }

  get adminPath(): string {
    return this.path;
  }
}
