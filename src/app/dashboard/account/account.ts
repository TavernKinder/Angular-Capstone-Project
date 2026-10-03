import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth';
import {
  FirestoreWriteService,
  ThemePreference,
  UserProfile,
} from '../../shared/services/firestore/firestore-write';
import { ThemeService } from '../../shared/services/theme/theme';

const USER_NAME_MIN_LENGTH = 3;
const USER_NAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);

  readonly profile = signal<UserProfile | null>(null);
  readonly accountError = signal<string | null>(null);
  readonly accountMessage = signal<string | null>(null);
  readonly isSavingTheme = signal(false);
  readonly isSavingUserName = signal(false);
  readonly isSavingPassword = signal(false);
  readonly showChangeUsernameFields = signal(false);
  readonly showChangePasswordFields = signal(false);

  readonly userName = computed(
    () => this.profile()?.userName ?? this.authService.currentUser()?.displayName ?? '',
  );
  // Google-only accounts have no password to change.
  readonly hasPasswordLogin = computed(
    () =>
      this.authService.currentUser()?.providerData.some((p) => p.providerId === 'password') ??
      false,
  );

  readonly userNameControl = new FormControl('', { nonNullable: true });
  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true }),
    newPassword: new FormControl('', { nonNullable: true }),
    confirmPassword: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.profile.set(null);
      this.accountError.set(null);
      if (user) void this.loadProfile(user);
    });
  }

  toggleChangeUsernameFields(): void {
    this.clearMessages();
    this.userNameControl.setValue(this.userName());
    this.showChangeUsernameFields.update((open) => !open);
  }

  toggleChangePasswordFields(): void {
    this.clearMessages();
    this.passwordForm.reset();
    this.showChangePasswordFields.update((open) => !open);
  }

  async saveUserName(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || this.isSavingUserName()) return;

    const userName = this.userNameControl.value.trim();
    this.clearMessages();
    if (userName.length < USER_NAME_MIN_LENGTH || userName.length > USER_NAME_MAX_LENGTH) {
      this.accountError.set(
        `Username must be ${USER_NAME_MIN_LENGTH}-${USER_NAME_MAX_LENGTH} characters.`,
      );
      return;
    }

    this.isSavingUserName.set(true);
    try {
      await this.firestoreWriteService.updateUserName(user, userName);
      this.profile.update((profile) => ({
        ...(profile ?? {}),
        userName,
      }));
      this.showChangeUsernameFields.set(false);
      this.accountMessage.set('Username updated.');
    } catch (err) {
      console.error('Failed to save username:', err);
      this.accountError.set('Unable to save your username. Please try again.');
    } finally {
      this.isSavingUserName.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (this.isSavingPassword()) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    this.clearMessages();
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.accountError.set('Fill in all password fields.');
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      this.accountError.set(`Use a password with at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      this.accountError.set('New passwords do not match.');
      return;
    }

    this.isSavingPassword.set(true);
    try {
      await this.authService.changePassword(currentPassword, newPassword);
      this.passwordForm.reset();
      this.showChangePasswordFields.set(false);
      this.accountMessage.set('Password updated.');
    } catch {
      this.accountError.set(this.authService.error() ?? 'Unable to change your password.');
    } finally {
      this.isSavingPassword.set(false);
    }
  }

  async changeTheme(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || this.isSavingTheme()) return;

    const theme: ThemePreference = this.themeService.theme() === 'dark' ? 'light' : 'dark';
    this.isSavingTheme.set(true);
    this.clearMessages();
    try {
      await this.firestoreWriteService.updateTheme(user, theme);
      this.themeService.setTheme(theme);
      this.profile.update((profile) => ({
        ...(profile ?? {}),
        preferences: { ...profile?.preferences, theme },
      }));
    } catch (err) {
      console.error('Failed to save theme preference:', err);
      this.accountError.set('Unable to save your theme preference. Please try again.');
    } finally {
      this.isSavingTheme.set(false);
    }
  }

  // Not implemented yet: reminders need a notification/scheduling setup.
  changeReminders(): void {
    // const user = this.authService.currentUser();
    // if (!user) return;
    // await this.firestoreWriteService.updateReminders(user, 'On');
    return;
  }

  // Not implemented yet: needs a location picker and the weather service to read it.
  changeDefaultLocation(): void {
    // const user = this.authService.currentUser();
    // if (!user) return;
    // await this.firestoreWriteService.updateDefaultLocation(user, 'Austin');
    return;
  }

  private clearMessages(): void {
    this.accountError.set(null);
    this.accountMessage.set(null);
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
