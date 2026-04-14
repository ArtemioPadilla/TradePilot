// TODO: implement notifications service

export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    severity?: string;
    link?: string;
    metadata?: any;
  },
): Promise<string> {
  // TODO: implement notification creation in Firestore
  return 'mock-notification-id';
}

export async function getNotifications(userId: string): Promise<any[]> {
  // TODO: implement notifications query
  return [];
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  // TODO: implement mark as read
}

export async function clearNotifications(userId: string): Promise<void> {
  // TODO: implement clear all notifications
}
