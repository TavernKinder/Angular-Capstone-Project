import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Weather } from './weather';

describe('Weather', () => {
  let service: Weather;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Weather);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads weather for Austin when using the default location', async () => {
    const loading = service.loadDefaultLocation();
    const request = httpTestingController.expectOne((req) =>
      req.url.startsWith('https://api.open-meteo.com/v1/forecast'),
    );
    const params = new URL(request.request.urlWithParams).searchParams;

    expect(params.get('latitude')).toBe('30.2672');
    expect(params.get('longitude')).toBe('-97.7431');

    request.flush({
      current: {
        temperature_2m: 70,
        apparent_temperature: 70,
        relative_humidity_2m: 50,
        is_day: 1,
        precipitation: 0,
        weather_code: 0,
        wind_speed_10m: 5,
      },
      daily: {
        time: [],
        weather_code: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_probability_max: [],
      },
    });
    await loading;

    expect(service.locationName()).toBe('Austin, TX (Default)');
    expect(service.weatherData()?.current.temperature_2m).toBe(70);
  });

  it('searches Open-Meteo for locations and returns the matching results', async () => {
    const searching = service.searchLocations('Austin, Texas');
    const request = httpTestingController.expectOne((req) =>
      req.url.startsWith('https://geocoding-api.open-meteo.com/v1/search'),
    );
    expect(new URL(request.request.urlWithParams).searchParams.get('name')).toBe('Austin, Texas');

    request.flush({
      results: [
        {
          name: 'Austin',
          admin1: 'Texas',
          country: 'United States',
          latitude: 30.2672,
          longitude: -97.7431,
        },
      ],
    });

    await expect(searching).resolves.toEqual([
      {
        name: 'Austin',
        admin1: 'Texas',
        country: 'United States',
        latitude: 30.2672,
        longitude: -97.7431,
      },
    ]);
  });

  it('requires at least two characters for a location search', async () => {
    await expect(service.searchLocations(' ')).rejects.toThrow(
      'Enter at least two characters to search for a location.',
    );
    httpTestingController.expectNone(
      (req) => req.url.startsWith('https://geocoding-api.open-meteo.com/v1/search'),
    );
  });
});
