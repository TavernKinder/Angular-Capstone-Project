import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth';
import { FirestoreWriteService } from '../firestore/firestore-write';

import { ThemeService } from './theme';

describe('ThemeService', () => {
  const currentUser = signal<{ uid: string } | null>(null);
  const getUserProfile = vi.fn();

  function createService(): ThemeService {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser } },
        { provide: FirestoreWriteService, useValue: { getUserProfile } },
      ],
    });
    return TestBed.inject(ThemeService);
  }

  function mockDeviceDark(matches: boolean) {
    const query = { matches, addEventListener: vi.fn() };
    window.matchMedia = vi.fn().mockReturnValue(query);
  }

  beforeEach(() => {
    mockDeviceDark(false);
    currentUser.set(null);
    getUserProfile.mockReset();
  });

  it('uses the device default when signed out', () => {
    const service = createService();
    TestBed.tick();
    expect(service.theme()).toBe('light');
  });

  it('loads the saved dark theme for a signed-in user', async () => {
    getUserProfile.mockResolvedValue({ preferences: { theme: 'dark' } });
    const service = createService();
    currentUser.set({ uid: 'user-123' });
    TestBed.tick();
    await vi.waitFor(() => expect(service.theme()).toBe('dark'));
  });

  it('falls back to the device default when the profile has no theme', async () => {
    getUserProfile.mockResolvedValue(null);
    const service = createService();
    currentUser.set({ uid: 'user-123' });
    TestBed.tick();
    await vi.waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    expect(service.theme()).toBe('light');
  });

  it('resets to the device default after sign out', async () => {
    getUserProfile.mockResolvedValue({ preferences: { theme: 'dark' } });
    const service = createService();
    currentUser.set({ uid: 'user-123' });
    TestBed.tick();
    await vi.waitFor(() => expect(service.theme()).toBe('dark'));

    currentUser.set(null);
    TestBed.tick();
    expect(service.theme()).toBe('light');
  });

  it('follows a dark device default when nothing is saved', async () => {
    mockDeviceDark(true);
    getUserProfile.mockResolvedValue(null);
    const service = createService();
    currentUser.set({ uid: 'user-123' });
    TestBed.tick();
    await vi.waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    expect(service.theme()).toBe('dark');
    expect(service.isDeviceDefault()).toBe(true);
  });

  it('applies the theme class to the document element', () => {
    const service = createService();
    TestBed.tick();
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });
});
