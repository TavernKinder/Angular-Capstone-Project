import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../shared/services/auth/auth';
import {
  FirestoreWriteService,
  ThemePreference,
  UserProfile,
} from '../../shared/services/firestore/firestore-write';

@Component({
  selector: 'app-account',
  imports: [],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  readonly authService = inject(AuthService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);
  readonly profile = signal<UserProfile | null>(null);
  readonly accountError = signal<string | null>(null);
  readonly isSavingTheme = signal(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.profile.set(null);
      this.accountError.set(null);
      if (user) void this.loadProfile(user);
    });
  }

  async changeTheme(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || this.isSavingTheme()) return;

    const theme: ThemePreference = this.profile()?.preferences?.theme === 'dark' ? 'light' : 'dark';
    this.isSavingTheme.set(true);
    this.accountError.set(null);
    try {
      await this.firestoreWriteService.updateTheme(user, theme);
      this.profile.update((profile) => ({
        ...(profile ?? { uid: user.uid, email: user.email }),
        preferences: { ...profile?.preferences, theme },
      }));
    } catch (err) {
      console.error('Failed to save theme preference:', err);
      this.accountError.set('Unable to save your theme preference. Please try again.');
    } finally {
      this.isSavingTheme.set(false);
    }
  }

  private async loadProfile(
    user: NonNullable<ReturnType<AuthService['currentUser']>>,
  ): Promise<void> {
    try {
      this.profile.set(await this.firestoreWriteService.getUserProfile(user));
    } catch (err) {
      console.error('Failed to load user profile:', err);
      this.accountError.set('Unable to load your account details. Please try again.');
    }
  }
}
