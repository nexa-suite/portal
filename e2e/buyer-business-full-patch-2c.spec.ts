import { expect, test } from '@playwright/test';
import { requiresBuyerCredentials, signInBuyer } from './support/auth';

test('Buyer commerce workspace performs the canonical purchase request draft flow', async ({ page }) => {
  test.setTimeout(60_000);
  requiresBuyerCredentials();
  await signInBuyer(page);

  await page.goto('/portal/account');
  await expect(page.getByRole('heading', { name: /^(client account profile|perfil de cuenta cliente)$/i })).toBeVisible();
  // The canonical Vue/Design Lab shell exposes the seven primary buyer
  // destinations; the commercial account route is reached from Profile.
  await expect(page.locator('.portal-navigation')).toContainText(/profile|perfil/i);

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
  await expect(page.getByRole('heading', { name: /request builder|purchase request|solicitud de compra/i })).toBeVisible();
  const steps = page.locator('.buyer-stepper .step-circle');
  await expect(steps).toHaveCount(4);
  await expect(page.locator('.buyer-stepper .step-label')).toHaveText([
    /buyer|comprador/i,
    /products|productos/i,
    /delivery|entrega/i,
    /confirm|confirmar/i,
  ]);

  await page.getByRole('button', { name: /continue to products|continuar a productos/i }).click();
  await expect(page.getByRole('heading', { name: /request items|productos solicitados/i })).toBeVisible();

  // Product selection is intentionally exercised through the live catalog.
  // The Builder only accepts server-authorized catalog items, so the E2E must
  // not inject a line directly into the cart or bypass Catalog.
  await page.getByRole('link', { name: /add products|agregar productos/i }).click();
  await expect(page).toHaveURL(/\/portal\/product-catalog/);
  const catalogSearch = page.locator('#catalog-search-input');
  const catalogList = page.waitForResponse(
    (response) => response.request().method() === 'GET' && new URL(response.url()).pathname.endsWith('/api/v1/catalog-items') && new URL(response.url()).searchParams.get('q') === 'PROD-0003',
  );
  await catalogSearch.fill('PROD-0003');
  await catalogSearch.press('Enter');
  const catalogResponse = await catalogList;
  expect(catalogResponse.ok()).toBeTruthy();
  const seededProduct = page.locator('article.catalog-management-card').filter({ hasText: 'PROD-0003' }).first();
  await expect(seededProduct).toBeVisible({ timeout: 10_000 });
  const selectedProductName = await seededProduct.locator('.catalog-card-title').innerText();
  await expect(seededProduct.getByRole('button', { name: /add to cart|agregar al carrito/i })).toBeVisible();
  await seededProduct.getByRole('button', { name: /add to cart|agregar al carrito/i }).click();
  await expect(seededProduct).toHaveClass(/selected/);

  await page.locator('.catalog-page-header').getByRole('link', { name: /request builder|constructor de solicitudes/i }).click();
  await expect(page).toHaveURL(/\/portal\/request-builder/);
  await expect(page.getByRole('heading', { name: /request items|productos solicitados/i })).toBeVisible();
  await expect(page.locator('.request-item-card')).toContainText(selectedProductName);
  await page.getByRole('button', { name: /continue to delivery|continuar a entrega/i }).click();

  const savedAddress = page.locator('select[formcontrolname="addressId"]');
  await page.getByRole('button', { name: /saved address|dirección guardada/i }).click();
  await expect(savedAddress).toBeVisible();
  const savedAddressOption = savedAddress.locator('option', { hasText: addressLabel });
  await expect(savedAddressOption).toHaveCount(1);
  const savedAddressId = await savedAddressOption.getAttribute('value');
  expect(savedAddressId).toBeTruthy();
  await savedAddress.selectOption(savedAddressId!);

  // The seeded ICISA account has no usable credit exposure in this runtime.
  // Bank transfer is a server-supported non-credit option and exercises the
  // same real preview/submission contracts without masking that API rule.
  await page.getByRole('button', { name: /bank transfer|transferencia bancaria/i }).click();

  const deliveryDate = page.locator('input[type="date"]');
  const minimumDate = await deliveryDate.getAttribute('min');
  expect(minimumDate).toBeTruthy();
  await deliveryDate.fill(minimumDate!);
  const preview = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/buyer\/purchase-request-drafts\/[^/]+\/route-previews$/.test(new URL(response.url()).pathname));
  await page.locator('.request-step-actions').getByRole('button', { name: /review|revisar/i }).click();
  const previewResponse = await preview;
  expect(previewResponse.status()).toBe(200);
  const previewBody = await previewResponse.json() as {
    readonly destination?: { readonly addressId?: string | null };
    readonly route?: { readonly provider?: string | null };
  };
  expect(previewBody.destination?.addressId).toBeTruthy();
  expect(previewBody.route?.provider).toMatch(/LOCAL/i);
  await expect(page.locator('body')).not.toContainText(/warehouseId|reservationId|internal warehouse/i);
  await expect(page.getByRole('heading', { name: /confirm cold-chain purchase request|confirmar solicitud de compra refrigerada/i })).toBeVisible();
  await expect(page.locator('.buyer-confirm-panel')).toContainText(/delivery and comments|entrega y comentarios|bank transfer|transferencia bancaria/i);

  const requestCreate = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/buyer\/purchase-request-drafts\/[^/]+\/submissions$/.test(new URL(response.url()).pathname));
  await page.locator('.request-step-actions').getByRole('button', { name: /submit request|enviar solicitud/i }).click();
  const requestResponse = await requestCreate;
  expect([200, 201]).toContain(requestResponse.status());
  await expect(page).toHaveURL(/\/portal\/purchase-requests\//);

  await page.goto('/portal/notifications');
  await expect(page.getByRole('heading', { name: /notifications|notificaciones/i })).toBeVisible();
});
