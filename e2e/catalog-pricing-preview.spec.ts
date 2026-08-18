import { expect, test } from '@playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('Buyer receives server-backed pricing previews for multiple quantities', async ({ page }) => {
  requiresBuyerCredentials();
  await signInBuyer(page);
  await page.goto('/portal/product-catalog/CAT-0002');
  await expect(page.locator('h1')).toBeVisible();

  const quantityInput = page.locator('.quantity-preview input[type="number"]');
  const previewResult = page.locator('.preview-result');
  await expect(quantityInput).toBeVisible();

  const belowThresholdRequest = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/api/v1/catalog/pricing-preview'),
  );
  await quantityInput.fill('1');
  await page.getByRole('button', { name: /preview|calcular|ver precio/i }).click();
  const belowThresholdResponse = await belowThresholdRequest;
  expect(belowThresholdResponse.ok()).toBeTruthy();
  expect((belowThresholdResponse.request().postDataJSON() as { readonly items: readonly [{ readonly quantity: number }] }).items[0].quantity).toBe(1);
  await expect(previewResult).toBeVisible();
  await expect(previewResult).toContainText(/PEN|USD/i);

  const qualifyingRequest = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/api/v1/catalog/pricing-preview'),
  );
  await quantityInput.fill('5');
  await page.getByRole('button', { name: /preview|calcular|ver precio/i }).click();
  const qualifyingResponse = await qualifyingRequest;
  expect(qualifyingResponse.ok()).toBeTruthy();
  expect((qualifyingResponse.request().postDataJSON() as { readonly items: readonly [{ readonly quantity: number }] }).items[0].quantity).toBe(5);
  await expect(previewResult).toBeVisible();
  await expect(previewResult.locator('dd')).toHaveCount(4);
});
