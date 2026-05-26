/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import nodemailer, { Transporter } from 'nodemailer';
import { NotificationPayload, NotificationType } from '@app/types';
import { GlobalConfigService } from '../../config/global-config.service';

export interface EmailResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

const templateMap: Record<NotificationType, { file: string; subject: string }> =
  {
    [NotificationType.PASSWORD_RESET]: {
      file: 'password-reset.hbs',
      subject: 'Password Reset Request',
    },
    [NotificationType.WELCOME]: {
      file: 'welcome.hbs',
      subject: 'Welcome to LRC Ecosystem',
    },
    [NotificationType.SYSTEM]: {
      file: 'notification.hbs',
      subject: 'System Notification',
    },
    [NotificationType.EMAIL_VERIFICATION]: {
      file: 'notification.hbs',
      subject: 'Email Verification',
    },
    [NotificationType.ALERT]: {
      file: 'notification.hbs',
      subject: 'Alert Notification',
    },
    [NotificationType.REMINDER]: {
      file: 'notification.hbs',
      subject: 'Reminder',
    },
    [NotificationType.ATTENDANCE_ALERT]: {
      file: 'notification.hbs',
      subject: 'Attendance Alert',
    },
    [NotificationType.JRS_MEMBER_CREATED]: {
      file: 'notification.hbs',
      subject: 'New JRS Member',
    },
    [NotificationType.JRS_MEMBER_ARCHIVED]: {
      file: 'notification.hbs',
      subject: 'JRS Member Archived',
    },
    [NotificationType.JRS_MEMBER_PROMOTED_PC]: {
      file: 'notification.hbs',
      subject: 'Promoted to Personne Contact',
    },
    [NotificationType.JRS_MEMBER_PROMOTED_AP]: {
      file: 'notification.hbs',
      subject: 'Promoted to Accompagnateur Parental',
    },
    [NotificationType.JRS_MEMBER_DEMOTED_PC]: {
      file: 'notification.hbs',
      subject: 'Removed as Personne Contact',
    },
    [NotificationType.JRS_MEMBER_DEMOTED_AP]: {
      file: 'notification.hbs',
      subject: 'Removed as Accompagnateur Parental',
    },
    [NotificationType.JRS_ACTIVITY_CREATED]: {
      file: 'notification.hbs',
      subject: 'New Activity Created',
    },
    [NotificationType.JRS_ACTIVITY_CANCELLED]: {
      file: 'notification.hbs',
      subject: 'Activity Cancelled',
    },
    [NotificationType.JRS_ACTIVITY_ARCHIVED]: {
      file: 'notification.hbs',
      subject: 'Activity Archived',
    },
    [NotificationType.JRS_ACTIVITY_ATTENDANCE_LOCKED]: {
      file: 'notification.hbs',
      subject: 'Activity Attendance Locked',
    },
    [NotificationType.JRS_ACTIVITY_MISSED]: {
      file: 'notification.hbs',
      subject: 'Activity Missed',
    },
    [NotificationType.JRS_BIRTHDAY_REMINDER]: {
      file: 'notification.hbs',
      subject: 'Birthday Reminder',
    },
    [NotificationType.INVITE]: {
      file: 'invite.hbs',
      subject: 'You have been invited to LRC',
    },
  };

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  private transporter: Transporter | null = null;
  private templates: Map<NotificationType, EmailTemplate> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly globalConfig: GlobalConfigService,
    @Inject('NOTIFICATION_TEMPLATES_DIR')
    private readonly templatesDir: string,
  ) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get('EMAIL_SECURE') === 'true',
      auth: user && pass ? { user, pass } : undefined,
    });

    this.logger.log(
      `Email provider initialized - connecting to ${host}:${port}`,
    );
  }

  private loadTemplates() {
    for (const [type, { file, subject }] of Object.entries(templateMap)) {
      try {
        const templatePath = path.join(this.templatesDir, file);
        const html = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(type as NotificationType, {
          subject,
          html,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to load template ${file}: ${(error as Error).message}`,
        );
      }
    }
  }

  async send(
    to: string,
    payload: NotificationPayload,
    type?: NotificationType,
  ): Promise<EmailResult> {
    try {
      const from =
        this.configService.get<string>('EMAIL_FROM') || 'noreply@lrc.org';
      const template = type ? this.templates.get(type) : null;

      const subject = template?.subject || 'LRC Notification';
      const html = template
        ? this.renderTemplate(template.html, payload)
        : this.getDefaultTemplate(payload);

      const result = await this.transporter?.sendMail({
        from,
        to,
        subject,
        html,
        text: payload.body,
      });

      return {
        success: true,
        externalId: result?.messageId,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email to ${to}: ${
          (error as Error)?.message ?? String(error)
        }`,
      );
      return {
        success: false,
        error: (error as Error)?.message ?? 'Unknown error',
      };
    }
  }

  private renderTemplate(template: string, data: NotificationPayload): string {
    const compiled = handlebars.compile(template);
    return compiled({
      title: data.title,
      body: data.body,
      actionUrl: data.actionUrl,
      image: data.image || data.imageUrl,
      ...data.data,
    });
  }

  private getDefaultTemplate(payload: NotificationPayload): string {
    void payload;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #4A4A4A; color: white; padding: 20px; text-align: center; }
            .body { padding: 20px; background: #f5f5f5; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{title}}</h1>
            </div>
            <div class="body">
              <p>{{body}}</p>
              {{#if actionUrl}}
              <p style="text-align: center;"><a href="{{actionUrl}}" class="button">View Details</a></p>
              {{/if}}
            </div>
            <div class="footer">
              <p>LRC Ecosystem Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter?.verify();
      return true;
    } catch (error) {
      this.logger.error(
        `Email connection verification failed: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
