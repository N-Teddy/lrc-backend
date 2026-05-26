import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InAppProvider } from './channels/in-app.provider';
import { Notification } from '@app/database/entities/notification/notification.entity';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly inAppProvider: InAppProvider,
    private readonly configService: ConfigService,
    @Optional()
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService?: NotificationService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token: string | undefined = client.handshake.auth.token as
        | string
        | undefined;

      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload: { sub: string; email: string } =
        this.jwtService.verify(token);
      const userId: string = payload.sub;

      (
        client.data as {
          user?: { id: string; email: string };
        }
      ).user = {
        id: userId,
        email: payload.email,
      };

      this.inAppProvider.registerClient(userId, client.id);
      this.logger.log(
        `User ${userId} connected to notifications (socket: ${client.id})`,
      );
    } catch (error) {
      this.logger.error(
        `WebSocket connection error: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { user?: { id: string } })?.user?.id;
    if (userId) {
      this.inAppProvider.unregisterClient(userId, client.id);
      this.logger.log(`User ${userId} disconnected from notifications`);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = (client.data as { user?: { id: string } }).user?.id || '';
      await this.notificationService?.markAsRead(data.notificationId, userId);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read: ${(error as Error).message}`,
      );
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong' };
  }

  sendNotificationToUser(userId: string, notification: Notification) {
    const m = this.inAppProvider['clientSockets'] as
      | Map<string, Set<string>>
      | undefined;
    if (m) {
      const sockets = m.get(userId);
      if (sockets && sockets.size > 0) {
        const ids = Array.from(sockets);
        ids.forEach((socketId: string) => {
          this.server.to(socketId).emit('notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            actionUrl: notification.actionUrl,
            priority: notification.priority,
            createdAt: notification.createdAt,
          });
        });
      }
    }
  }

  sendNotificationToUsers(userIds: string[], notification: Notification) {
    userIds.forEach((userId: string) => {
      this.sendNotificationToUser(userId, notification);
    });
  }
}
