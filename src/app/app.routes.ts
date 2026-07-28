import { Routes } from '@angular/router';
import { PortalShellComponent } from './core/layout/portal-shell/portal-shell.component';
import { HomePageComponent } from './core/presentation/home-page/home-page.component';

export const routes: Routes = [
  {
    path: '',
    component: PortalShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: HomePageComponent },
      { path: '**', redirectTo: 'home' }
    ]
  }
];
