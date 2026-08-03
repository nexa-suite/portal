import { expect, test } from '@playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('Buyer commerce workspace exposes contextual account, builder and notification surfaces', async ({ page }) => {
  requiresBuyerCredentials();
  await signInBuyer(page);

  await page.goto('/portal/account');
  await expect(page.getByRole('heading', { name: /^(client account profile|perfil de cuenta cliente)$/i })).toBeVisible();
  await expect(page.locator('.portal-navigation')).toContainText(/account|cuenta/i);

  await page.goto('/portal/request-builder');
  await expect(page.getByRole('heading', { name: /purchase request|solicitud de compra/i })).toBeVisible();
  await expect(page.locator('.steps')).toContainText(/buyer|comprador/i);

  await page.goto('/portal/notifications');
  await expect(page.getByRole('heading', { name: /notifications|notificaciones/i })).toBeVisible();
});
