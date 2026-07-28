import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [HomePageComponent], providers: [provideTranslateService()] }).compileComponents(); fixture = TestBed.createComponent(HomePageComponent); fixture.detectChanges(); });
  it('renders reusable buyer foundations', () => { expect(fixture.nativeElement.querySelector('nexa-page-header')).toBeTruthy(); expect(fixture.nativeElement.querySelector('nexa-section-panel')).toBeTruthy(); });
});
