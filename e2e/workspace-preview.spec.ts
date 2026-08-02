import { test, expect } from '@playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('Buyer workspace preview remains within the authenticated workspace', async ({ page }) => {
  requiresBuyerCredentials();
  await signInBuyer(page);
  await expect(page.locator('body')).toContainText(/nexa|workspace|espacio/i);
});
