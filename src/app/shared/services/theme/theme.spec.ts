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

  beforeEach(() => {
    currentUser.set(null);
    getUserProfile.mockReset();
  });

  it('defaults to light when signed out', () => {
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

  it('falls back to light when the profile has no theme', async () => {
    getUserProfile.mockResolvedValue(null);
    const service = createService();
    currentUser.set({ uid: 'user-123' });
    TestBed.tick();
    await vi.waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    expect(service.theme()).toBe('light');
  });

  it('resets to light after sign out', async () => {
    getUserProfile.mockResolvedValue({ preferences: { theme: 'dark' } });
    const service = createService();
    currentUser.set({ uid: 'user-123' });
    TestBed.tick();
    await vi.waitFor(() => expect(service.theme()).toBe('dark'));

    currentUser.set(null);
    TestBed.tick();
    expect(service.theme()).toBe('light');
  });
});