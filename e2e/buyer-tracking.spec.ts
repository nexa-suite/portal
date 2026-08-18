import { test, expect } from '@playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('Buyer sees safe delivery tracking and no internal fields', async ({ page }) => {
  requiresBuyerCredentials();
  await signInBuyer(page);
  await page.goto('/portal/deliveries');
  await expect(page.locator('body')).toContainText(/delivery|entrega/i);
  await expect(page.locator('body')).not.toContainText(/reservationId|clientAccountId|membership/i);
});
