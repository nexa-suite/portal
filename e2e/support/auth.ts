import { expect, Page } from 'playwright/test';

export async function signInBuyer(page: Page): Promise<void> {
  const email = process.env.NEXA_E2E_BUYER_EMAIL;
  const password = process.env.NEXA_E2E_BUYER_PASSWORD;
  if (!email || !password) throw new Error('Missing NEXA_E2E_BUYER_EMAIL/NEXA_E2E_BUYER_PASSWORD for authenticated browser evidence');
  await page.goto('/sign-in');
  await page.locator('input[autocomplete="organization"]').fill(process.env.NEXA_E2E_WORKSPACE ?? 'icisa');
  await page.locator('input[autocomplete="username"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: /continue to portal|sign in|ingresar|continuar al portal/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10_000 });
  await expect(page.locator('main, [role="main"]')).toBeVisible();
}

export function requiresBuyerCredentials(): void {
  if (!process.env.NEXA_E2E_BUYER_EMAIL || !process.env.NEXA_E2E_BUYER_PASSWORD) throw new Error('Set NEXA_E2E_BUYER_EMAIL and NEXA_E2E_BUYER_PASSWORD before authenticated browser validation');
}
