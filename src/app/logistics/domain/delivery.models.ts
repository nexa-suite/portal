export type BuyerDeliveryStatus = 'PREPARING_DELIVERY' | 'DELIVERY_SCHEDULED' | 'IN_TRANSIT' | 'DELIVERY_REVIEW' | 'DELIVERY_RESCHEDULED' | 'DELIVERED' | 'DELIVERY_CANCELLED' | 'UNKNOWN';
export interface Delivery { id: string; dispatchNumber: string; salesOrderId: string; salesOrderNumber: string; clientAccountId: string; status: BuyerDeliveryStatus; destination: string | null; deliveryWindowStart: string | null; deliveryWindowEnd: string | null; eta: string | null; podStatus: string | null; version: number; updatedAt: string; alerts: readonly string[]; }
export interface DeliveryEvent { id: string; type: string; occurredAt: string; summary: string | null; }
export interface DeliveryPage { items: readonly Delivery[]; page: number; size: number; total: number; }
