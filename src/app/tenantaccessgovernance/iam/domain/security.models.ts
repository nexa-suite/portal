export type SecurityMode = 'forgot' | 'reset' | 'profile' | 'password' | 'sessions';
export interface Profile { readonly userId: string; readonly email: string; readonly displayName: string; readonly phone: string | null; readonly preferredLanguage: string; readonly timezone: string; readonly version: number; }
export interface ActiveSession { readonly sessionId: string; readonly surface: string; readonly createdAt: string; readonly lastSeenAt: string; readonly expiresAt: string; readonly current: boolean; readonly deviceLabel: string | null; readonly coarseIp: string | null; }
