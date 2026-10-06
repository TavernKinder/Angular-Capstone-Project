import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Instantiated here so the saved theme is applied on startup.
  private readonly themeService = inject(ThemeService);
  protected readonly title = signal('capstoneProject');
}
