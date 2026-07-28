import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatCardModule, RouterOutlet, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly translate = inject(TranslateService);
  protected readonly selectedLanguage = signal<'en' | 'es'>('en');
  protected readonly contexts = [
    'shell.contexts.iam',
    'shell.contexts.catalogManagement',
    'shell.contexts.sales',
    'shell.contexts.logistics',
    'shell.contexts.invoicing'
  ];

  protected changeLanguage(language: string): void {
    const nextLanguage = language === 'es' ? 'es' : 'en';
    this.selectedLanguage.set(nextLanguage);
    this.translate.use(nextLanguage);
  }
}
