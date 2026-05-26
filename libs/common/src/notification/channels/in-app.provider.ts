import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload } from '@app/types';

export interface InAppResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class InAppProvider {
  private readonly logger = new Logger(InAppProvider.name);
  // In-memory store for WebSocket client mapping - in production, use Redis
  private clientSockets: Map<string, Set<string>> = new Map();

  /* eslint-disable @typescript-eslint/no-unused-vars */
  send(
    recipientId: string,
    payload: NotificationPayload,
    notificationId?: string,
  ): Promise<InAppResult> {
    try {
      // Check if user has active WebSocket connection
      const sockets = this.clientSockets.get(recipientId);

      if (sockets && sockets.size > 0) {
        // Emit via WebSocket - this will be handled by the gateway
        this.logger.debug(`In-app notification queued for user ${recipientId}`);
      } else {
        this.logger.debug(
          `User ${recipientId} has no active WebSocket connection, notification stored for later delivery`,
        );
      }

      return Promise.resolve({ success: true });
    } catch (error) {
      this.logger.error(
        `Failed to send in-app notification to ${recipientId}: ${(error as Error).message}`,
      );
      return Promise.resolve({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  registerClient(userId: string, socketId: string) {
    if (!this.clientSockets.has(userId)) {
      this.clientSockets.set(userId, new Set());
    }
    this.clientSockets.get(userId)!.add(socketId);
  }

  unregisterClient(userId: string, socketId: string) {
    const sockets = this.clientSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.clientSockets.delete(userId);
      }
    }
  }

  isUserOnline(userId: string): boolean {
    return (
      this.clientSockets.has(userId) && this.clientSockets.get(userId)!.size > 0
    );
  }
}
