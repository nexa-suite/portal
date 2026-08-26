import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CatalogApiClient } from '../../../catalogcommercialpolicy/infrastructure/catalog-api.client';
import { DeliveryTrackingApiClient } from '../../../fulfillmentdelivery/infrastructure/delivery-tracking-api.client';
import { ReceivablesApiClient } from '../../../creditreceivables/infrastructure/receivables-api.client';
import { PurchaseRequestApiClient } from '../../../salescommitment/infrastructure/purchase-requests/purchase-request-api.client';
import { SalesOrderApiClient } from '../../../salescommitment/infrastructure/orders/sales-order-api.client';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: CatalogApiClient, useValue: { list: () => of({ items: [], page: 0, size: 1, totalItems: 0, totalPages: 0, sort: { field: '', direction: '' } }) } },
        { provide: DeliveryTrackingApiClient, useValue: { list: () => of({ items: [], page: 0, size: 100, total: 0 }) } },
        { provide: ReceivablesApiClient, useValue: { list: () => of({ items: [], page: 0, size: 25, total: 0 }) } },
        { provide: PurchaseRequestApiClient, useValue: { list: () => of({ items: [], page: 0, size: 50, total: 0 }) } },
        { provide: SalesOrderApiClient, useValue: { list: () => of({ items: [], page: 0, size: 50, total: 0 }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
  });
  it('renders reusable buyer foundations', () => {
    expect(fixture.nativeElement.querySelector('nexa-page-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('nexa-section-panel')).toBeTruthy();
  });
});
