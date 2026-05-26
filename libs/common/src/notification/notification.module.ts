import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { EmailProvider } from './channels/email.provider';
import { InAppProvider } from './channels/in-app.provider';
import { WhatsAppProvider } from './channels/whatsapp.provider';
import { NotificationGateway } from './notification.gateway';
import { Notification } from '@app/database/entities/notification/notification.entity';
import { Person } from '@app/database/entities/core/person.entity';
import { User } from '@app/database/entities/core/user.entity';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import { CommonModule } from '../common.module';
import * as path from 'path';
import { InjectionToken } from '@nestjs/common';

interface NotificationModuleConfig {
  templatesDir?: string;
}

const NOTIFICATION_TEMPLATES_DIR = 'NOTIFICATION_TEMPLATES_DIR';
const NOTIFICATION_MODULE_CONFIG = 'NOTIFICATION_MODULE_CONFIG';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Person, User, AppProfile]),
    CommonModule,
  ],
  controllers: [],
  providers: [
    NotificationService,
    EmailProvider,
    InAppProvider,
    WhatsAppProvider,
    NotificationGateway,
    {
      provide: NOTIFICATION_TEMPLATES_DIR,
      useFactory: (config: NotificationModuleConfig) =>
        config.templatesDir ||
        path.join(process.cwd(), 'libs/common/src/notification/templates'),
      inject: [NOTIFICATION_MODULE_CONFIG],
    },
  ],
  exports: [
    NotificationService,
    EmailProvider,
    InAppProvider,
    WhatsAppProvider,
  ],
})
export class NotificationModule {
  static forRoot(config: NotificationModuleConfig = {}): DynamicModule {
    return {
      module: NotificationModule,
      providers: [
        {
          provide: NOTIFICATION_MODULE_CONFIG,
          useValue: config,
        },
      ],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<NotificationModuleConfig> | NotificationModuleConfig;
    inject?: InjectionToken[];
  }): DynamicModule {
    return {
      module: NotificationModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: NOTIFICATION_MODULE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
    };
  }
}
