import { InjectionToken } from '@angular/core';
import type { ChangeFeedListener } from '../domain/change-feed.models';

export interface ChangeFeedFetchPort {
  watch(listener: ChangeFeedListener): () => void;
}

export const CHANGE_FEED_FETCH_PORT = new InjectionToken<ChangeFeedFetchPort>('CHANGE_FEED_FETCH_PORT');
