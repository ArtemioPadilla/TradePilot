// TODO: implement push notifications service

export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // TODO: implement browser notification permission request
  return 'default';
}

export async function sendPushNotification(options: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}): Promise<void> {
  // TODO: implement push notification via service worker
}
