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
    loadWeatherForDeviceLocation: ReturnType<typeof vi.fn>;
    loadWeatherForLocation: ReturnType<typeof vi.fn>;
    loadDefaultLocation: ReturnType<typeof vi.fn>;
    weatherData: ReturnType<typeof signal>;
    locationName: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
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
      const loaded = weatherService.loadWeatherForLocation.mock.calls.length +
        weatherService.loadWeatherForDeviceLocation.mock.calls.length +
        weatherService.loadDefaultLocation.mock.calls.length;
      expect(loaded).toBeGreaterThan(0);
    });
  }

  beforeEach(() => {
    currentUser.set(user);
    firestoreWriteService = { getUserProfile: vi.fn().mockResolvedValue(null) };
    weatherService = {
      loadWeatherForDeviceLocation: vi.fn().mockRejectedValue(new Error('denied')),
      loadWeatherForLocation: vi.fn().mockResolvedValue(undefined),
      loadDefaultLocation: vi.fn().mockResolvedValue(undefined),
      weatherData: signal(null),
      locationName: signal('Austin, TX (Default)'),
      isLoading: signal(false),
      error: signal(null),
    };
  });

  it('uses device location before the saved account location', async () => {
    weatherService.loadWeatherForDeviceLocation.mockResolvedValue(undefined);
    firestoreWriteService.getUserProfile.mockResolvedValue({
      preferences: {
        defaultLocation: {
          name: 'Saved City',
          coordinates: { latitude: 1, longitude: 2 },
        },
      },
    });

    await render();

    expect(weatherService.loadWeatherForDeviceLocation).toHaveBeenCalled();
    expect(firestoreWriteService.getUserProfile).not.toHaveBeenCalled();
    expect(weatherService.loadWeatherForLocation).not.toHaveBeenCalled();
    expect(weatherService.loadDefaultLocation).not.toHaveBeenCalled();
  });

  it('uses the saved account location when device location is unavailable', async () => {
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
    expect(weatherService.loadWeatherForDeviceLocation).toHaveBeenCalled();
    expect(weatherService.loadDefaultLocation).not.toHaveBeenCalled();
  });

  it('uses Austin when no default location is saved', async () => {
    firestoreWriteService.getUserProfile.mockResolvedValue({ preferences: {} });

    await render();

    expect(weatherService.loadDefaultLocation).toHaveBeenCalled();
    expect(weatherService.loadWeatherForLocation).not.toHaveBeenCalled();
    expect(weatherService.loadWeatherForDeviceLocation).toHaveBeenCalled();
  });

  it('uses Austin when signed out', async () => {
    currentUser.set(null);

    await render();

    expect(firestoreWriteService.getUserProfile).not.toHaveBeenCalled();
    expect(weatherService.loadDefaultLocation).toHaveBeenCalled();
    expect(weatherService.loadWeatherForDeviceLocation).toHaveBeenCalled();
  });

  it('uses Austin if the profile cannot be read', async () => {
    firestoreWriteService.getUserProfile.mockRejectedValue(new Error('denied'));

    await render();

    expect(weatherService.loadDefaultLocation).toHaveBeenCalled();
  });

  it('uses Austin when saved coordinates are invalid', async () => {
    firestoreWriteService.getUserProfile.mockResolvedValue({
      preferences: {
        defaultLocation: {
          name: 'Invalid Place',
          coordinates: { latitude: 95, longitude: -97 },
        },
      },
    });

    await render();

    expect(weatherService.loadDefaultLocation).toHaveBeenCalled();
    expect(weatherService.loadWeatherForLocation).not.toHaveBeenCalled();
  });
});
