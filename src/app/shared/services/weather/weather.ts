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

@Injectable({
  providedIn: 'root'
})
export class Weather {
  private readonly http = inject(HttpClient);
  
  // Signals for state management
  readonly weatherData = signal<WeatherData | null>(null);
  readonly locationName = signal<string>('Detecting Location...');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async loadWeatherForCurrentLocation(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    if (!navigator.geolocation) {
      this.error.set('Geolocation is not supported by your browser.');
      this.isLoading.set(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      await this.fetchWeather(latitude, longitude);
      await this.fetchLocationName(latitude, longitude);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to get location.');
      // Fallback to a default location (e.g. Austin, TX) if location is denied
      console.log('Falling back to default location (Austin, TX)');
      await this.fetchWeather(30.2672, -97.7431);
      this.locationName.set('Austin, TX (Default)');
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
