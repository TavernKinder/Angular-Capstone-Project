import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { ThemeService } from '../../shared/services/theme/theme';

import { Account } from './account';

describe('Account', () => {
  let component: Account;
  let fixture: ComponentFixture<Account>;
  const user = {
    uid: 'user-123',
    email: 'p@example.com',
    providerData: [{ providerId: 'password' }],
  };
  let authService: {
    currentUser: () => typeof user | null;
    changePassword: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let firestoreWriteService: {
    getUserProfile: ReturnType<typeof vi.fn>;
    updateUserName: ReturnType<typeof vi.fn>;
    updateTheme: ReturnType<typeof vi.fn>;
  };
  let themeService: {
    theme: ReturnType<typeof signal<'light' | 'dark'>>;
    setTheme: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      currentUser: () => user,
      changePassword: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockReturnValue(null),
    };
    firestoreWriteService = {
      getUserProfile: vi.fn().mockResolvedValue({ userName: 'Tav', preferences: {} }),
      updateUserName: vi.fn().mockResolvedValue(undefined),
      updateTheme: vi.fn().mockResolvedValue(undefined),
    };
    themeService = { theme: signal<'light' | 'dark'>('light'), setTheme: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Account],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: FirestoreWriteService, useValue: firestoreWriteService },
        { provide: ThemeService, useValue: themeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Account);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the stored userName', () => {
    expect(component.userName()).toBe('Tav');
  });

  it('rejects a username that is too short', async () => {
    component.userNameControl.setValue('ab');
    await component.saveUserName();
    expect(component.accountError()).toContain('Username must be');
    expect(firestoreWriteService.updateUserName).not.toHaveBeenCalled();
  });

  it('saves a trimmed username to Firestore', async () => {
    component.userNameControl.setValue('  NewName  ');
    await component.saveUserName();
    expect(firestoreWriteService.updateUserName).toHaveBeenCalledWith(user, 'NewName');
    expect(component.userName()).toBe('NewName');
    expect(component.accountMessage()).toBe('Username updated.');
  });

  it('rejects mismatched new passwords', async () => {
    component.passwordForm.setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password-1',
      confirmPassword: 'new-password-2',
    });
    await component.savePassword();
    expect(component.accountError()).toBe('New passwords do not match.');
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password through the auth service', async () => {
    component.passwordForm.setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password-1',
      confirmPassword: 'new-password-1',
    });
    await component.savePassword();
    expect(authService.changePassword).toHaveBeenCalledWith('old-password', 'new-password-1');
    expect(component.accountMessage()).toBe('Password updated.');
  });

  it('shows the auth service error when the password change fails', async () => {
    authService.changePassword.mockRejectedValue(new Error('failed'));
    authService.error.mockReturnValue('Current password is incorrect.');
    component.passwordForm.setValue({
      currentPassword: 'wrong',
      newPassword: 'new-password-1',
      confirmPassword: 'new-password-1',
    });
    await component.savePassword();
    expect(component.accountError()).toBe('Current password is incorrect.');
  });

  it('saves the new theme and applies it', async () => {
    await component.changeTheme();
    expect(firestoreWriteService.updateTheme).toHaveBeenCalledWith(user, 'dark');
    expect(themeService.setTheme).toHaveBeenCalledWith('dark');
  });

  it('does not apply the theme when saving fails', async () => {
    firestoreWriteService.updateTheme.mockRejectedValue(new Error('denied'));
    await component.changeTheme();
    expect(themeService.setTheme).not.toHaveBeenCalled();
    expect(component.accountError()).toContain('theme preference');
  });

  it('leaves the unimplemented preference handlers as no-ops', () => {
    expect(() => component.changeReminders()).not.toThrow();
    expect(() => component.changeDefaultLocation()).not.toThrow();
  });

  function hasChangePasswordButton(fixture: ComponentFixture<Account>): boolean {
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    return buttons.some((button) => button.textContent?.trim() === 'Change Password');
  }

  it('shows the Change Password button for email/password accounts', async () => {
    await fixture.whenStable();
    expect(hasChangePasswordButton(fixture)).toBe(true);
  });

  it('hides the Change Password button for Google accounts', async () => {
    const googleUser = { ...user, providerData: [{ providerId: 'google.com' }] };
    authService.currentUser = () => googleUser;

    const googleFixture = TestBed.createComponent(Account);
    await googleFixture.whenStable();

    expect(hasChangePasswordButton(googleFixture)).toBe(false);
  });
});
