import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import type { Notification } from '@app/database/entities/notification/notification.entity';

@Injectable()
export class NotificationEventBus extends EventEmitter {
  emit(event: 'notification.sent', notification: Notification): boolean;
  emit(event: string, ...args: unknown[]): boolean;
  override emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, args);
  }

  on(
    event: 'notification.sent',
    listener: (notification: Notification) => void,
  ): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  override on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }
}
