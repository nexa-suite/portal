import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface AuthLifecycleEvent {
  readonly type: 'logout';
}

const CHANNEL_NAME = 'nexa-portal-auth-lifecycle';

/** Only non-sensitive lifecycle events cross tabs; tokens remain in memory. */
@Injectable({ providedIn: 'root' })
export class AuthLifecycleChannel {
  private readonly subject = new Subject<AuthLifecycleEvent>();
  private readonly channel: BroadcastChannel | null;

  readonly events: Observable<AuthLifecycleEvent> = this.subject.asObservable();

  constructor() {
    if (typeof BroadcastChannel === 'undefined') {
      this.channel = null;
      return;
    }
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (isLogout(event.data)) this.subject.next({ type: 'logout' });
    });
  }

  broadcastLogout(): void {
    const event: AuthLifecycleEvent = { type: 'logout' };
    this.channel?.postMessage(event);
  }
}

function isLogout(value: unknown): value is AuthLifecycleEvent {
  return value !== null && typeof value === 'object'
    && (value as { readonly type?: unknown }).type === 'logout';
}
