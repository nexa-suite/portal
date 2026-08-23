import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { providePortalRuntimeConfig } from '../../security/runtime-config';
import { PortalShellComponent } from './portal-shell.component';

describe('PortalShellComponent', () => {
  let fixture: ComponentFixture<PortalShellComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalShellComponent],
      providers: [
        provideHttpClient(),
        providePortalRuntimeConfig(),
        provideRouter([]),
        provideTranslateService(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PortalShellComponent);
    fixture.detectChanges();
  });
  it('renders buyer navigation, language control and content outlet', () => {
    expect(fixture.nativeElement.querySelector('.portal-navigation')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('nexa-language-switcher')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.sign-out-button')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/portal/support"]')).toBeNull();
  });
});
