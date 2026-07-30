import { firstValueFrom } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { PortalAuthStateService } from '../../../iam/application/portal-auth-state.service';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../security/runtime-config';
import { ChangeFeedEvent, ChangeFeedListener } from '../domain/change-feed.models';

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseEvent(type: string, id: string, data: string): ChangeFeedEvent | null {
  if (!data.trim()) return null;
  let raw: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed !== null && typeof parsed === 'object') raw = parsed as Record<string, unknown>;
  } catch {
    raw = { message: data };
  }
  const resourceValue = stringValue(raw['resource'] ?? raw['resourceType'] ?? raw['aggregateType']).toUpperCase();
  const resource = resourceValue === 'PURCHASE_REQUEST' || resourceValue === 'PURCHASE-REQUEST'
    ? 'PURCHASE_REQUEST'
    : resourceValue === 'SALES_ORDER' || resourceValue === 'SALES-ORDER'
      ? 'SALES_ORDER'
      : 'UNKNOWN';
  return {
    id: id || stringValue(raw['id']) || `${type}:${stringValue(raw['resourceId'] ?? raw['aggregateId'])}`,
    type: type || stringValue(raw['type']) || 'change',
    resource,
    resourceId: stringValue(raw['resourceId'] ?? raw['aggregateId'] ?? raw['purchaseRequestId'] ?? raw['salesOrderId']) || null,
  };
}

@Injectable({ providedIn: 'root' })
export class ChangeFeedFetchClient {
  private readonly auth = inject(PortalAuthStateService);
  private readonly config = inject(PORTAL_RUNTIME_CONFIG);
  private readonly listeners = new Set<ChangeFeedListener>();
  private readonly seenIds = new Set<string>();
  private controller: AbortController | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventId = '';
  private running = false;

  watch(listener: ChangeFeedListener): () => void {
    this.listeners.add(listener);
    if (!this.running) {
      this.running = true;
      void this.run();
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.stop();
    };
  }

  stop(): void {
    this.running = false;
    this.controller?.abort();
    this.controller = null;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private async run(): Promise<void> {
    if (!this.running) return;
    const token = this.auth.accessToken();
    if (!token) {
      this.scheduleRetry(1500);
      return;
    }

    const valid = await firstValueFrom(this.auth.revalidateSession());
    if (!valid || !this.running) {
      this.scheduleRetry(2000);
      return;
    }

    this.controller = new AbortController();
    const deadline = setTimeout(() => this.controller?.abort(), 55_000);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.auth.accessToken() ?? token}`,
        Accept: 'text/event-stream',
        'X-Nexa-Surface': 'PORTAL',
      };
      if (this.lastEventId) headers['Last-Event-ID'] = this.lastEventId;
      const response = await fetch(portalApiUrl(this.config, '/api/v1/change-feed/stream'), {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: this.controller.signal,
      });
      if (!response.ok) throw new Error(`Change feed returned ${response.status}`);
      if (!response.body) throw new Error('Change feed did not return a readable stream');
      await this.readStream(response.body);
    } catch {
      // The feed is an accelerator. Targeted HTTP reloads remain authoritative.
    } finally {
      clearTimeout(deadline);
      this.controller = null;
      if (this.running) this.scheduleRetry(1000);
    }
  }

  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let type = '';
    let id = '';
    let data: string[] = [];
    let eventsSinceValidation = 0;
    try {
      while (this.running) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          for (const field of frame.split(/\r?\n/)) {
            if (field.startsWith('event:')) type = field.slice(6).trim();
            else if (field.startsWith('id:')) id = field.slice(3).trim();
            else if (field.startsWith('data:')) data.push(field.slice(5).trimStart());
          }
          const event = parseEvent(type, id, data.join('\n'));
          if (event && !this.seenIds.has(event.id)) {
            this.seenIds.add(event.id);
            this.lastEventId = event.id;
            for (const listener of this.listeners) listener(event);
            eventsSinceValidation += 1;
            if (eventsSinceValidation >= 20) {
              eventsSinceValidation = 0;
              if (!await firstValueFrom(this.auth.revalidateSession())) return;
            }
          }
          type = '';
          id = '';
          data = [];
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private scheduleRetry(delay: number): void {
    if (!this.running || this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.run();
    }, delay);
  }
}
