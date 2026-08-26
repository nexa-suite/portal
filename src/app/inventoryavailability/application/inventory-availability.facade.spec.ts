import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InventoryAvailabilityApiPort } from './ports/inventory-availability-api.port';
import { InventoryAvailabilityFacade } from './inventory-availability.facade';

describe('InventoryAvailabilityFacade', () => {
  it('preserves a recoverable API error instead of silently mapping it to UNKNOWN', () => {
    const api = { list: vi.fn(() => throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ providers: [InventoryAvailabilityFacade, { provide: InventoryAvailabilityApiPort, useValue: api }] });
    const facade = TestBed.inject(InventoryAvailabilityFacade);
    facade.load(['CAT-1']);
    expect(facade.error()).toBe('AVAILABILITY_LOAD_FAILED');
    expect(facade.items()).toEqual([]);
    facade.retry();
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('clears stale buyer availability when the requested item set becomes empty', () => {
    const api = { list: vi.fn(() => of([{ catalogItemId: 'CAT-1', status: 'AVAILABLE' as const, asOf: '2026-08-04T00:00:00Z' }])) };
    TestBed.configureTestingModule({ providers: [InventoryAvailabilityFacade, { provide: InventoryAvailabilityApiPort, useValue: api }] });
    const facade = TestBed.inject(InventoryAvailabilityFacade);

    facade.load(['CAT-1', 'CAT-1']);
    facade.load([]);

    expect(api.list).toHaveBeenCalledOnce();
    expect(api.list).toHaveBeenCalledWith(['CAT-1']);
    expect(facade.items()).toEqual([]);
    expect(facade.loading()).toBe(false);
  });
});
