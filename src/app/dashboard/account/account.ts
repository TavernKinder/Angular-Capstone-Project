import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth/auth';
import {
  DefaultLocationPreference,
  FirestoreWriteService,
  ThemePreference,
  UserProfile,
} from '../../shared/services/firestore/firestore-write';
import { ThemeService } from '../../shared/services/theme/theme';
import { LocationSearchResult, Weather } from '../../shared/services/weather/weather';

const USER_NAME_MIN_LENGTH = 3;
const USER_NAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-account',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly weatherService = inject(Weather);
  private readonly router = inject(Router);
  private readonly firestoreWriteService = inject(FirestoreWriteService);
  readonly themePreference = signal<ThemePreference | null>(null);

  readonly profile = signal<UserProfile | null>(null);
  readonly accountError = signal<string | null>(null);
  readonly accountMessage = signal<string | null>(null);
  readonly isSavingTheme = signal(false);
  readonly isSavingUserName = signal(false);
  readonly isSavingPassword = signal(false);
  readonly isSearchingLocations = signal(false);
  readonly isSavingLocation = signal(false);
  readonly locationResults = signal<LocationSearchResult[]>([]);
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
  readonly locationSearchControl = new FormControl('', { nonNullable: true });
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
      this.setAccountError(
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
      this.setAccountError('Unable to save your username. Please try again.');
    } finally {
      this.isSavingUserName.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (this.isSavingPassword()) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    this.clearMessages();
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.setAccountError('Fill in all password fields.');
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      this.setAccountError(`Use a password with at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      this.setAccountError('New passwords do not match.');
      return;
    }

    this.isSavingPassword.set(true);
    try {
      await this.authService.changePassword(currentPassword, newPassword);
      this.passwordForm.reset();
      this.showChangePasswordFields.set(false);
      this.accountMessage.set('Password updated.');
    } catch {
      this.setAccountError(this.authService.error() ?? 'Unable to change your password.');
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
      this.setAccountError('Unable to save your theme preference. Please try again.');
    } finally {
      this.isSavingTheme.set(false);
    }
  }

  async logout(): Promise<void> {
    const loggedOut = await this.authService.logout();
    if (loggedOut) {
      await this.router.navigateByUrl('/');
    }
  }

  // Not implemented yet: reminders need a notification/scheduling setup.
  changeReminders(): void {
    // const user = this.authService.currentUser();
    // if (!user) return;
    // await this.firestoreWriteService.updateReminders(user, 'On');
    return;
  }

  async searchLocations(): Promise<void> {
    if (this.isSearchingLocations()) return;

    const query = this.locationSearchControl.value.trim();
    this.clearMessages();
    this.locationResults.set([]);
    if (query.length < 2) {
      this.setAccountError('Enter at least two characters to search for a location.');
      return;
    }

    this.isSearchingLocations.set(true);
    try {
      const results = await this.weatherService.searchLocations(query);
      this.locationResults.set(results);
      if (results.length === 0) this.setAccountError('No matching locations found.');
    } catch (err) {
      console.error('Failed to search for locations:', err);
      this.setAccountError('Unable to search for locations. Please try again.');
    } finally {
      this.isSearchingLocations.set(false);
    }
  }

  async saveDefaultLocation(result: LocationSearchResult): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || this.isSavingLocation()) return;

    const defaultLocation: DefaultLocationPreference = {
      name: [result.name, result.admin1, result.country].filter(Boolean).join(', '),
      coordinates: { latitude: result.latitude, longitude: result.longitude },
    };

    this.clearMessages();
    this.isSavingLocation.set(true);
    try {
      await this.firestoreWriteService.updateDefaultLocation(user, defaultLocation);
      this.profile.update((profile) => ({
        ...(profile ?? {}),
        preferences: { ...profile?.preferences, defaultLocation },
      }));
      this.locationResults.set([]);
      this.accountMessage.set('Weather location saved.');
      await this.weatherService.loadWeatherForLocation(
        result.latitude,
        result.longitude,
        defaultLocation.name,
      );
    } catch (err) {
      console.error('Failed to save the default location:', err);
      this.setAccountError('Unable to save your weather location. Please try again.');
    } finally {
      this.isSavingLocation.set(false);
    }
  }

  private clearMessages(): void {
    this.accountError.set(null);
    this.accountMessage.set(null);
  }

  private setAccountError(message: string): void {
    this.accountError.set(message);
  }

  private async loadProfile(
    user: NonNullable<ReturnType<AuthService['currentUser']>>,
  ): Promise<void> {
    try {
      this.profile.set(await this.firestoreWriteService.getUserProfile(user));
    } catch (err) {
      console.error('Failed to load user profile:', err);
      this.setAccountError('Unable to load your account details. Please try again.');
    }
  }
}
