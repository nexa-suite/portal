export interface PortalNotification {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly message: string;
  readonly deepLink: string | null;
  readonly subjectType: string | null;
  readonly subjectId: string | null;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export interface NotificationPage {
  readonly items: readonly PortalNotification[];
  readonly unreadCount: number;
  readonly limit: number;
}
