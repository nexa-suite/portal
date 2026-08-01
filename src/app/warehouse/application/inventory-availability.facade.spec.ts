import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { InventoryAvailabilityApiClient } from '../infrastructure/inventory-availability-api.client';
import { InventoryAvailabilityFacade } from './inventory-availability.facade';

describe('InventoryAvailabilityFacade', () => {
  it('preserves a recoverable API error instead of silently mapping it to UNKNOWN', () => {
    const api = { list: vi.fn(() => throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ providers: [InventoryAvailabilityFacade, { provide: InventoryAvailabilityApiClient, useValue: api }] });
    const facade = TestBed.inject(InventoryAvailabilityFacade);
    facade.load(['CAT-1']);
    expect(facade.error()).toBe('AVAILABILITY_LOAD_FAILED');
    expect(facade.items()).toEqual([]);
    facade.retry();
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
