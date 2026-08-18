import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogPricingItem } from '../../domain/catalog.models';
import { CatalogPricingSummaryComponent } from './catalog-pricing-summary.component';

const pricing: CatalogPricingItem = {
  basePrice: { amount: '100.00', currency: 'PEN' },
  effectivePrice: { amount: '90.00', currency: 'PEN' },
  discountAmount: { amount: '10.00', currency: 'PEN' },
  currency: 'PEN',
  appliedPromotions: [{
    id: 'PROMO-1',
    name: 'Buyer launch price',
    discountType: 'FIXED_AMOUNT',
    discountAmount: '10.00',
  }],
  pricingAsOf: '2026-08-02T12:30:00Z',
};

describe('CatalogPricingSummaryComponent', () => {
  let fixture: ComponentFixture<CatalogPricingSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogPricingSummaryComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { catalog: {
      pricingDetails: 'Pricing details', basePrice: 'Base price', effectivePrice: 'Effective price',
      discountAmount: 'Discount', currency: 'Currency', appliedPromotions: 'Applied promotions',
      noPromotions: 'None', pricingAsOf: 'Pricing as of: {{value}}'
    }});
    translate.use('en');
    fixture = TestBed.createComponent(CatalogPricingSummaryComponent);
    fixture.componentRef.setInput('pricing', pricing);
    fixture.detectChanges();
  });

  it('renders server-provided pricing values and applied promotions', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PEN 100.00');
    expect(text).toContain('PEN 90.00');
    expect(text).toContain('PEN 10.00');
    expect(text).toContain('Buyer launch price');
    expect(text).toContain('FIXED_AMOUNT');
    expect(text).toContain('2026-08-02T12:30:00Z');
  });

  it('shows an explicit empty promotions state without adding buyer controls', () => {
    fixture.componentRef.setInput('pricing', { ...pricing, appliedPromotions: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.no-promotions')?.textContent).toContain('None');
    expect(fixture.nativeElement.querySelectorAll('a, button')).toHaveLength(0);
  });
});
