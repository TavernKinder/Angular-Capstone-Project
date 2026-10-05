import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth';
import { FirestoreWriteService, ThemePreference } from '../firestore/firestore-write';


@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly authService = inject(AuthService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);


  readonly theme = signal<ThemePreference>('light');

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.theme.set('light');
        return;
      }

      void this.loadSavedTheme(user);
    });
  }

  setTheme(theme: ThemePreference): void {
    this.theme.set(theme);
  }

  private async loadSavedTheme(user: NonNullable<ReturnType<AuthService['currentUser']>>) {
    try {
      const profile = await this.firestoreWriteService.getUserProfile(user);
      // Ignore the result if the user signed out or switched while loading.
      if (this.authService.currentUser()?.uid !== user.uid) return;
      this.theme.set(profile?.preferences?.theme === 'dark' ? 'dark' : 'light');
    } catch (err) {
      console.error('Failed to load saved theme:', err);
    }
  }
}
