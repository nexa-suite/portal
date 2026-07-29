import { routes } from './app.routes';

describe('Portal routes', () => {
  it('exposes public access and protected buyer routes', () => {
    expect(routes.find((route) => route.path === '')?.redirectTo).toBe('sign-in');
    expect(routes.some((route) => route.path === 'sign-in')).toBe(true);
    expect(routes.some((route) => route.path === 'forbidden')).toBe(true);
    const portal = routes.find((route) => route.path === 'portal');
    const children = portal?.children ?? [];
    expect(children.some((route) => route.path === 'home')).toBe(true);
    expect(children.some((route) => route.path === 'product-catalog')).toBe(true);
    expect(children.some((route) => route.path === 'product-catalog/:catalogItemId')).toBe(true);
    expect(children.find((route) => route.path === 'catalog')?.redirectTo).toBe('product-catalog');
    expect(children.find((route) => route.path === 'catalog/:catalogItemId')?.redirectTo).toBe(
      'product-catalog/:catalogItemId',
    );
  });
});
