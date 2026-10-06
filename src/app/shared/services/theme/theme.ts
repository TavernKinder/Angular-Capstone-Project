import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth';
import { FirestoreWriteService, ThemePreference } from '../firestore/firestore-write';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly authService = inject(AuthService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);
  private readonly document = inject(DOCUMENT);

  private readonly deviceTheme = signal<ThemePreference>('light');
  /** The account's saved choice, or null when none is set. */
  private readonly savedTheme = signal<ThemePreference | null>(null);

  /** The theme currently applied: the saved choice, otherwise the device default. */
  readonly theme = computed(() => this.savedTheme() ?? this.deviceTheme());
  readonly isDeviceDefault = computed(() => this.savedTheme() === null);

  constructor() {
    this.watchDeviceTheme();

    // Classes go on <html> so :root theme variables and the body background follow the theme.
    effect(() => {
      const isDark = this.theme() === 'dark';
      const classList = this.document.documentElement.classList;
      classList.toggle('theme-dark', isDark);
      classList.toggle('theme-light', !isDark);
    });

    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.savedTheme.set(null);
        return;
      }

      void this.loadSavedTheme(user);
    });
  }

  setTheme(theme: ThemePreference): void {
    this.savedTheme.set(theme);
  }

  private watchDeviceTheme(): void {
    const query = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;

    const update = () => this.deviceTheme.set(query.matches ? 'dark' : 'light');
    update();
    query.addEventListener('change', update);
  }

  private async loadSavedTheme(user: NonNullable<ReturnType<AuthService['currentUser']>>) {
    try {
      const profile = await this.firestoreWriteService.getUserProfile(user);
      // Ignore the result if the user signed out or switched while loading.
      if (this.authService.currentUser()?.uid !== user.uid) return;
      const saved = profile?.preferences?.theme;
      this.savedTheme.set(saved === 'light' || saved === 'dark' ? saved : null);
    } catch (err) {
      console.error('Failed to load saved theme:', err);
    }
  }
}
