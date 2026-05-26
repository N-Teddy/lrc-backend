import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload } from '@app/types';

export interface WhatsAppResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  send(
    _phoneNumber: string,
    _payload: NotificationPayload,
  ): Promise<WhatsAppResult> {
    // Placeholder for future WhatsApp integration
    this.logger.warn('WhatsApp provider not yet implemented');
    return Promise.resolve({
      success: false,
      error: 'WhatsApp provider not configured',
    });
  }

  isAvailable(): Promise<boolean> {
    // Check if WhatsApp API is configured
    return Promise.resolve(false);
  }
}
