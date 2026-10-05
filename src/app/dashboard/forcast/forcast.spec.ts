import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { Weather } from '../../shared/services/weather/weather';

import { Forcast } from './forcast';

describe('Forcast', () => {
  const user = { uid: 'user-123' };
  const currentUser = signal<typeof user | null>(user);
  let firestoreWriteService: { getUserProfile: ReturnType<typeof vi.fn> };
  let weatherService: {
    loadWeatherForLocation: ReturnType<typeof vi.fn>;
    loadWeatherForCurrentLocation: ReturnType<typeof vi.fn>;
  };

  async function render(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Forcast],
      providers: [
        { provide: AuthService, useValue: { currentUser } },
        { provide: FirestoreWriteService, useValue: firestoreWriteService },
        { provide: Weather, useValue: weatherService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Forcast);
    await fixture.whenStable();
    await vi.waitFor(() => {
      const loaded =
        weatherService.loadWeatherForLocation.mock.calls.length +
        weatherService.loadWeatherForCurrentLocation.mock.calls.length;
      expect(loaded).toBeGreaterThan(0);
    });
  }

  beforeEach(() => {
    currentUser.set(user);
    firestoreWriteService = { getUserProfile: vi.fn().mockResolvedValue(null) };
    weatherService = {
      loadWeatherForLocation: vi.fn().mockResolvedValue(undefined),
      loadWeatherForCurrentLocation: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('uses the saved default location when one exists', async () => {
    firestoreWriteService.getUserProfile.mockResolvedValue({
      preferences: {
        defaultLocation: {
          name: 'Austin, Texas, United States',
          coordinates: { latitude: 30.27, longitude: -97.74 },
        },
      },
    });

    await render();

    expect(weatherService.loadWeatherForLocation).toHaveBeenCalledWith(
      30.27,
      -97.74,
      'Austin, Texas, United States',
    );
    expect(weatherService.loadWeatherForCurrentLocation).not.toHaveBeenCalled();
  });

  it('detects the current location when no default is saved', async () => {
    firestoreWriteService.getUserProfile.mockResolvedValue({ preferences: {} });

    await render();

    expect(weatherService.loadWeatherForCurrentLocation).toHaveBeenCalled();
    expect(weatherService.loadWeatherForLocation).not.toHaveBeenCalled();
  });

  it('detects the current location when signed out', async () => {
    currentUser.set(null);

    await render();

    expect(firestoreWriteService.getUserProfile).not.toHaveBeenCalled();
    expect(weatherService.loadWeatherForCurrentLocation).toHaveBeenCalled();
  });

  it('falls back to the current location if the profile cannot be read', async () => {
    firestoreWriteService.getUserProfile.mockRejectedValue(new Error('denied'));

    await render();

    expect(weatherService.loadWeatherForCurrentLocation).toHaveBeenCalled();
  });
});
