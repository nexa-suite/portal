import { expect, test } from '@playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('Buyer commerce workspace performs the canonical purchase request draft flow', async ({ page }) => {
  test.setTimeout(60_000);
  requiresBuyerCredentials();
  await signInBuyer(page);

  await page.goto('/portal/account');
  await expect(page.getByRole('heading', { name: /^(client account profile|perfil de cuenta cliente)$/i })).toBeVisible();
  await expect(page.locator('.portal-navigation')).toContainText(/account|cuenta/i);

  const addressLabel = `E2E 2C ${Date.now()}`;
  await page.getByRole('button', { name: /add address|agregar dirección/i }).click();
  await page.getByRole('textbox', { name: /label|etiqueta/i }).fill(addressLabel);
  await page.getByRole('textbox', { name: /address|dirección/i }).fill('Av. Real 250');
  await page.getByRole('textbox', { name: /reference|referencia/i }).fill('Puerta azul');
  await page.getByRole('textbox', { name: /recipient name|nombre del receptor/i }).fill('Elena Litano');
  await page.getByRole('textbox', { name: /recipient phone|teléfono del receptor/i }).fill('+51999999999');
  await page.getByRole('textbox', { name: /street name|nombre de la vía/i }).fill('Real');
  await page.locator('[formcontrolname="streetNumber"]').fill('250');
  await page.getByRole('combobox', { name: /department|departamento/i }).selectOption('15');
  const province = page.getByRole('combobox', { name: /province|provincia/i });
  await expect(province).toHaveValue('');
  await province.selectOption('1501');
  const district = page.getByRole('combobox', { name: /district|distrito/i });
  await expect(district).toHaveValue('');
  await district.selectOption('150101');
  await page.locator('[formcontrolname="latitude"]').fill('-12.0464');
  await page.locator('[formcontrolname="longitude"]').fill('-77.0428');
  await page.getByRole('checkbox', { name: /default address|dirección predeterminada/i }).check();
  const addressCreate = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/api/v1/client-accounts/') && response.url().endsWith('/addresses'));
  await page.getByRole('button', { name: /save address|guardar dirección/i }).click();
  const addressResponse = await addressCreate;
  expect(addressResponse.status()).toBe(201);
  await expect(page.locator('.address-card').filter({ hasText: addressLabel })).toBeVisible();

  await page.goto('/portal/request-builder');
  await expect(page.getByRole('heading', { name: /purchase request|solicitud de compra/i })).toBeVisible();
  await expect(page.locator('.steps')).toContainText(/buyer|comprador/i);

  const savedAddress = page.locator('select[formcontrolname="addressId"]');
  const savedAddressOption = savedAddress.locator('option', { hasText: addressLabel });
  await expect(savedAddressOption).toHaveCount(1);
  const savedAddressId = await savedAddressOption.getAttribute('value');
  expect(savedAddressId).toBeTruthy();
  await savedAddress.selectOption(savedAddressId!);
  await page.getByRole('button', { name: /next|continue|siguiente|continuar/i }).click();

  await page.getByRole('textbox', { name: /search|buscar/i }).fill('');
  await page.getByRole('button', { name: /search|buscar/i }).click();
  const productSelect = page.getByRole('combobox', { name: /item|ítem/i });
  await expect(productSelect.locator('option').nth(1)).toBeAttached({ timeout: 10_000 });
  const seededProduct = productSelect.locator('option[value="CAT-0003"]');
  await expect(seededProduct).toHaveCount(1);
  await productSelect.selectOption('CAT-0003');
  await page.getByRole('button', { name: /add|agregar/i }).click();
  await page.getByRole('button', { name: /next|continue|siguiente|continuar/i }).click();

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.locator('input[type="date"]').fill(tomorrow);
  const preview = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/buyer\/purchase-request-drafts\/[^/]+\/route-previews$/.test(new URL(response.url()).pathname));
  await page.locator('.form-actions').getByRole('button', { name: /review|revisar/i }).click();
  const previewResponse = await preview;
  expect(previewResponse.status()).toBe(200);
  await expect(page.locator('.buyer-map-preview')).toBeVisible();
  await expect(page.locator('.buyer-map-preview')).toContainText(/Av\. Real 250|E2E 2C/i);
  await expect(page.locator('.route-card')).toContainText(/LOCAL_DETERMINISTIC|LOCAL_ESTIMATE/i);
  const mapLink = page.getByRole('link', { name: /open map|abrir mapa/i });
  if (await mapLink.count()) await expect(mapLink).toHaveAttribute('href', /^https?:\/\//);
  await expect(page.locator('body')).not.toContainText(/warehouseId|reservationId|internal warehouse/i);
  await page.getByRole('button', { name: /next|continue|siguiente|continuar/i }).click();
  await page.getByRole('button', { name: /next|continue|siguiente|continuar/i }).click();

  const requestCreate = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/buyer\/purchase-request-drafts\/[^/]+\/submissions$/.test(new URL(response.url()).pathname));
  await page.locator('.form-actions').getByRole('button', { name: /submit request|enviar solicitud/i }).click();
  const requestResponse = await requestCreate;
  expect([200, 201]).toContain(requestResponse.status());
  await expect(page).toHaveURL(/\/portal\/purchase-requests\//);

  await page.goto('/portal/notifications');
  await expect(page.getByRole('heading', { name: /notifications|notificaciones/i })).toBeVisible();
});
