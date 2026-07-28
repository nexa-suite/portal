import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { PortalShellComponent } from './portal-shell.component';

describe('PortalShellComponent', () => {
  let fixture: ComponentFixture<PortalShellComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [PortalShellComponent], providers: [provideRouter([]), provideTranslateService()] }).compileComponents(); fixture = TestBed.createComponent(PortalShellComponent); fixture.detectChanges(); });
  it('renders buyer navigation, language control and content outlet', () => { expect(fixture.nativeElement.querySelector('.portal-navigation')).toBeTruthy(); expect(fixture.nativeElement.querySelector('nexa-language-switcher')).toBeTruthy(); expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy(); });
});
