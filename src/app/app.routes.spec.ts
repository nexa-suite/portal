import { routes } from './app.routes';

describe('Portal routes', () => {
  it('redirects the root and unknown paths to home inside the shell', () => {
    const children = routes[0].children ?? [];
    expect(children.find((route) => route.path === '')?.redirectTo).toBe('home');
    expect(children.find((route) => route.path === '**')?.redirectTo).toBe('home');
    expect(children.some((route) => route.path === 'home')).toBe(true);
  });
});
