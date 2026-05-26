import {
  Injectable,
  Optional,
  forwardRef,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotificationStatus,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationPayload,
} from '@app/types';
import { Notification } from '@app/database/entities/notification/notification.entity';
import { Person } from '@app/database/entities/core/person.entity';
import { User } from '@app/database/entities/core/user.entity';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import {
  EmailProvider,
  InAppProvider,
  WhatsAppProvider,
  RetryStrategy,
} from '.';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly retryStrategy: RetryStrategy;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AppProfile)
    private readonly profileRepo: Repository<AppProfile>,
    private readonly configService: ConfigService,
    private readonly emailProvider: EmailProvider,
    private readonly inAppProvider: InAppProvider,
    private readonly whatsAppProvider: WhatsAppProvider,
    @Optional()
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway?: NotificationGateway,
  ) {
    this.retryStrategy = new RetryStrategy({
      attempts:
        this.configService.get<number>('NOTIFICATION_RETRY_ATTEMPTS') || 3,
      baseDelay:
        this.configService.get<number>('NOTIFICATION_RETRY_BASE_DELAY') || 1000,
    });
  }

  async sendToUser(
    userId: string,
    payload: NotificationPayload,
    options?: {
      type?: NotificationType;
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      relatedEntityId?: string;
    },
  ): Promise<Notification> {
    const person = await this.personRepo.findOne({
      where: { id: userId },
      relations: ['user'],
    });

    if (!person) {
      throw new Error(`Person with id ${userId} not found`);
    }

    const channels = options?.channels || this.getDefaultChannels(person);

    const notification = this.notificationRepo.create({
      recipientId: userId,
      type: options?.type || NotificationType.SYSTEM,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      actionUrl: payload.actionUrl,
      imageUrl: payload.imageUrl,
      priority: options?.priority || NotificationPriority.MEDIUM,
      relatedEntityId: options?.relatedEntityId,
      channel: channels[0],
    });

    const savedNotification = await this.notificationRepo.save(notification);

    // Send via each channel
    await this.sendViaChannels(savedNotification, person, channels);

    // Log notification event
    this.logger.log(
      `Notification sent to user ${userId}: ${savedNotification.id}`,
    );

    return savedNotification;
  }

  async sendToUsers(
    userIds: string[],
    payload: NotificationPayload,
    options?: {
      type?: NotificationType;
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      relatedEntityId?: string;
    },
  ): Promise<Notification[]> {
    const defaultChannels = options?.channels || [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ];

    // Parallelize notifications using Promise.allSettled
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        this.sendToUser(userId, payload, {
          ...options,
          channels: defaultChannels,
        }).catch(() => null),
      ),
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<Notification> =>
          r.status === 'fulfilled' && r.value !== null,
      )
      .map((r) => r.value);
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    await this.notificationRepo.save(notification);

    this.logger.log(
      `Notification ${notificationId} marked as read by user ${userId}`,
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { recipientId: userId, status: NotificationStatus.SENT },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
  }

  async getUserNotifications(
    userId: string,
    filters?: {
      status?: NotificationStatus;
      type?: NotificationType;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const queryBuilder = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('notification.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('notification.type = :type', {
        type: filters.type,
      });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const [notifications, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const unreadCount = await this.notificationRepo.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.SENT,
      },
    });

    return { notifications, total, unreadCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.SENT,
      },
    });
  }

  private async sendViaChannels(
    notification: Notification,
    person: Person,
    channels: NotificationChannel[],
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      actionUrl: notification.actionUrl,
      image: notification.imageUrl,
      imageUrl: notification.imageUrl,
    };

    // Try each channel in order until one succeeds
    for (const channel of channels) {
      try {
        let result: { success: boolean; error?: string; externalId?: string };

        switch (channel) {
          case NotificationChannel.EMAIL:
            result = await this.sendWithRetry(() =>
              this.emailProvider.send(person.email, payload, notification.type),
            );
            break;

          case NotificationChannel.IN_APP:
            result = await this.inAppProvider.send(
              person.id,
              payload,
              notification.id,
            );
            break;

          case NotificationChannel.WHATSAPP:
            if (person.phone) {
              result = await this.whatsAppProvider.send(person.phone, payload);
            } else {
              result = { success: false, error: 'No phone number' };
            }
            break;

          default:
            result = { success: false, error: 'Unknown channel' };
        }

        notification.externalId = result.externalId || notification.externalId;
        if (result.success) {
          notification.status = NotificationStatus.SENT;
          notification.sentAt = new Date();

          if (
            channel === NotificationChannel.IN_APP &&
            this.notificationGateway
          ) {
            this.notificationGateway.sendNotificationToUser(
              person.id,
              notification,
            );
          }
          break;
        } else {
          notification.failureReason = result.error ?? 'Unknown error';
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send via ${channel}: ${errorMessage}`);
        notification.failureReason = errorMessage;
      }
    }

    // Save once at the end
    await this.notificationRepo.save(notification);
  }

  private async sendWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.retryStrategy.getAttempts(),
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (
          attempt < maxAttempts &&
          this.retryStrategy.shouldRetry(error as Error, attempt)
        ) {
          const delay = this.retryStrategy.calculateDelay(attempt);
          this.logger.warn(
            `Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after all retry attempts');
  }

  private getDefaultChannels(person: Person): NotificationChannel[] {
    const channels = [NotificationChannel.IN_APP];

    if (person.email) {
      channels.push(NotificationChannel.EMAIL);
    }

    if (person.phone) {
      channels.push(NotificationChannel.WHATSAPP);
    }

    return channels;
  }
}
