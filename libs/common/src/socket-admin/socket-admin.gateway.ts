import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketAdminConfig } from './socket-admin.config';
import { instrument } from '@socket.io/admin-ui';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : [];

      // Always allow localhost on any port and the hosted Socket.IO admin UI
      const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
      const isAdminUi = origin === 'https://admin.socket.io';
      const isExplicitlyAllowed = allowedOrigins.includes(origin);

      if (isLocalhost || isAdminUi || isExplicitlyAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketAdminGateway implements OnGatewayInit {
  private readonly logger = new Logger(SocketAdminGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly socketAdminConfig: SocketAdminConfig) {}

  afterInit(server: Server) {
    if (this.socketAdminConfig.enabled) {
      instrument(server, {
        auth: {
          type: 'basic',
          username: this.socketAdminConfig.auth.username,
          password: this.socketAdminConfig.auth.password,
        },
        mode: 'development',
      });
      this.logger.log('Socket.IO Admin UI enabled at /socket.io/admin');
    }
  }
}
