export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  image?: string;
  imageUrl?: string;
}
