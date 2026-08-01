import { test, expect } from 'playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('public password recovery is available without Buyer authentication', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: /recover your password|recuperar contraseña/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /send instructions|enviar instrucciones/i })).toBeDisabled();
});

test('Buyer remains in the portal boundary and cannot reach Platform administration', async ({ page }) => {
  requiresBuyerCredentials();
  await signInBuyer(page);
  await page.goto('/ops/operations/company-administration');
  await expect(page).not.toHaveURL(/ops\/operations\/company-administration/);
  await expect(page).toHaveURL(/portal|forbidden|sign-in/);
  await expect(page.locator('body')).not.toContainText(/tenant admin|company administration|workspace memberships/i);
});
