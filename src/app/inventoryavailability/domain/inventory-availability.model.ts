export type InventoryAvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
export interface InventoryAvailability { readonly catalogItemId: string; readonly status: InventoryAvailabilityStatus; readonly asOf: string; }
