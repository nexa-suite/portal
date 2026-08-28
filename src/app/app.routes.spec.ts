import { routes } from './app.routes';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';

describe('Portal routes', () => {
  it('exposes public access and protected buyer routes', async () => {
    expect(routes.find((route) => route.path === '')?.redirectTo).toBe('sign-in');
    expect(routes.some((route) => route.path === 'sign-in')).toBe(true);
    expect(routes.some((route) => route.path === 'forbidden')).toBe(true);
    const portal = routes.find((route) => route.path === 'portal');
    const children = portal?.children ?? [];
    expect(children.some((route) => route.path === 'home')).toBe(true);
    expect(children.some((route) => route.path === 'account')).toBe(true);
    expect(children.some((route) => route.path === 'notifications')).toBe(true);
    expect(children.some((route) => route.path === 'product-catalog')).toBe(true);
    expect(children.some((route) => route.path === 'request-builder')).toBe(true);
    expect(children.some((route) => route.path === 'sales-orders')).toBe(true);
    expect(children.some((route) => route.path === 'documents')).toBe(true);
    expect(children.some((route) => route.path === 'receivables')).toBe(true);
    expect(children.some((route) => route.path === 'receivables/:receivableId')).toBe(true);
    expect(children.some((route) => route.path === 'payment-methods')).toBe(true);
    expect(children.some((route) => route.path === 'purchase-orders')).toBe(true);
    expect(children.some((route) => route.path === 'purchase-orders/success')).toBe(true);
    expect(children.some((route) => route.path === 'premium')).toBe(true);
    expect(children.find((route) => route.path === 'support')?.data?.['section']).toBe('support');
    expect(children.some((route) => route.path === 'legal')).toBe(true);
    for (const path of ['legal', 'legal/terms', 'legal/privacy']) {
      expect(children.find((route) => route.path === path)?.data?.['section']).toBe('legal');
    }
    const lazyRoutes = async (path: string): Promise<Routes> => {
      const route = children.find((item) => item.path === path);
      expect(typeof route?.loadChildren).toBe('function');
      return (await (route?.loadChildren as () => Promise<Routes>)());
    };
    expect((await lazyRoutes('product-catalog')).some((route) => route.path === ':catalogItemId')).toBe(true);
    expect((await lazyRoutes('request-builder')).some((route) => route.path === ':purchaseRequestId')).toBe(true);
    expect((await lazyRoutes('sales-orders')).some((route) => route.path === ':salesOrderId')).toBe(true);
    expect(children.find((route) => route.path === 'orders')?.redirectTo).toBe('sales-orders');
    expect(children.find((route) => route.path === 'my-orders')?.redirectTo).toBe('sales-orders');
    expect(children.find((route) => route.path === 'catalog')?.redirectTo).toBe('product-catalog');
    expect(typeof children.find((route) => route.path === 'catalog/:catalogItemId')?.redirectTo).toBe('function');
  });

  it('preserves dynamic request and catalog alias parameters', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const children = routes.find((route) => route.path === 'portal')?.children ?? [];
    const requestAlias = children.find((route) => route.path === 'requests/:purchaseRequestId');
    const catalogAlias = children.find((route) => route.path === 'catalog/:catalogItemId');
    const orderAlias = children.find((route) => route.path === 'orders/:salesOrderId');
    const requestRedirect = TestBed.runInInjectionContext(() => (requestAlias?.redirectTo as (data: unknown) => unknown)({ params: { purchaseRequestId: 'PR-123' } }));
    const catalogRedirect = TestBed.runInInjectionContext(() => (catalogAlias?.redirectTo as (data: unknown) => unknown)({ params: { catalogItemId: 'CAT-123' } }));
    const orderRedirect = TestBed.runInInjectionContext(() => (orderAlias?.redirectTo as (data: unknown) => unknown)({ params: { salesOrderId: 'SO-123' } }));
    expect(String(requestRedirect)).toContain('/portal/purchase-requests/PR-123');
    expect(String(catalogRedirect)).toContain('/portal/product-catalog/CAT-123');
    expect(String(orderRedirect)).toContain('/portal/sales-orders/SO-123');
  });
});
