import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CatalogApiClient } from '../../../catalog-management/infrastructure/catalog-api.client';
import { DeliveryTrackingApiClient } from '../../../logistics/infrastructure/delivery-tracking-api.client';
import { PaymentsApiClient } from '../../../payments/infrastructure/payments-api.client';
import { PurchaseRequestApiClient } from '../../../sales/purchase-requests/infrastructure/purchase-request-api.client';
import { SalesOrderApiClient } from '../../../sales/orders/infrastructure/sales-order-api.client';
import { PortalAuthStateService } from '../../../iam/application/portal-auth-state.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: PortalAuthStateService, useValue: { identity: () => ({ displayName: 'Buyer' }) } },
        { provide: CatalogApiClient, useValue: { list: () => of({ items: [], page: 0, size: 1, totalItems: 0, totalPages: 0, sort: { field: '', direction: '' } }) } },
        { provide: DeliveryTrackingApiClient, useValue: { list: () => of({ items: [], page: 0, size: 100, total: 0 }) } },
        { provide: PaymentsApiClient, useValue: { list: () => of({ items: [], page: 0, size: 25, total: 0 }) } },
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
