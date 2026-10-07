import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export interface LocationSearchResult {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchResponse {
  results?: LocationSearchResult[];
}

@Injectable({
  providedIn: 'root',
})
export class Weather {
  private readonly http = inject(HttpClient);
  private readonly defaultLocation = {
    name: 'Austin, TX (Default)',
    latitude: 30.2672,
    longitude: -97.7431,
  };

  // Signals for state management
  readonly weatherData = signal<WeatherData | null>(null);
  readonly locationName = signal<string>('Detecting Location...');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      throw new Error('Enter at least two characters to search for a location.');
    }

    const url =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}` +
      '&count=5&language=en&format=json';
    const response = await firstValueFrom(this.http.get<LocationSearchResponse>(url));
    return (response.results ?? []).filter(
      (location) =>
        typeof location.name === 'string' &&
        typeof location.country === 'string' &&
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude),
    );
  }

  async loadWeatherForCurrentLocation(): Promise<void> {
    try {
      await this.loadWeatherForDeviceLocation();
    } catch (err) {
      console.warn('Unable to detect the current location; using the default location:', err);
      await this.loadDefaultLocation();
    }
  }

  async loadWeatherForDeviceLocation(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      await this.fetchWeather(latitude, longitude);
      await this.fetchLocationName(latitude, longitude);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadWeatherForLocation(
    latitude: number,
    longitude: number,
    locationName?: string,
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    if (locationName) this.locationName.set(locationName);

    try {
      await this.fetchWeather(latitude, longitude);
      if (!locationName) await this.fetchLocationName(latitude, longitude);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadDefaultLocation(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    this.locationName.set(this.defaultLocation.name);
    try {
      await this.fetchWeather(this.defaultLocation.latitude, this.defaultLocation.longitude);
    } finally {
      this.isLoading.set(false);
    }
  }

  async fetchWeather(latitude: number, longitude: number): Promise<void> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

    try {
      const data = await firstValueFrom(this.http.get<WeatherData>(url));
      this.weatherData.set(data);
      this.error.set(null);
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
      this.error.set('Failed to fetch weather data. Please try again later.');
      this.weatherData.set(null);
    }
  }

  async fetchLocationName(latitude: number, longitude: number): Promise<void> {
    const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    try {
      const geoData: any = await firstValueFrom(this.http.get(geoUrl));
      const city = geoData.city || geoData.locality || 'Unknown City';
      const state = geoData.principalSubdivision || '';

      if (state) {
        this.locationName.set(`${city}, ${state}`);
      } else {
        this.locationName.set(city);
      }
    } catch (err) {
      console.error('Failed to fetch location name:', err);
      this.locationName.set('Current Location');
    }
  }
}
