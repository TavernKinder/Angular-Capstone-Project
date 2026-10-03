import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '[class.theme-light]': "themeService.theme() === 'light'",
    '[class.theme-dark]': "themeService.theme() === 'dark'",
  },
})
export class App {
  protected readonly themeService = inject(ThemeService);
  protected readonly title = signal('capstoneProject');
}
