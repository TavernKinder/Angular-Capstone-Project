import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { Weather } from '../../shared/services/weather/weather';

@Component({
  selector: 'app-forcast',
  imports: [CommonModule],
  templateUrl: './forcast.html',
  styleUrl: './forcast.css',
})
export class Forcast implements OnInit {
  public weatherService = inject(Weather);
  public isForecastExpanded = signal(false);
  private readonly authService = inject(AuthService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);

  ngOnInit(): void {
    void this.loadForecast();
  }

  private async loadForecast(): Promise<void> {
    try {
      await this.weatherService.loadWeatherForDeviceLocation();
      return;
    } catch (err) {
      console.warn('Unable to use the device location:', err);
    }

    const user = this.authService.currentUser();
    if (user) {
      try {
        const profile = await this.firestoreWriteService.getUserProfile(user);
        const defaultLocation = profile?.preferences?.defaultLocation;
        const coordinates = defaultLocation?.coordinates;

        if (
          typeof defaultLocation?.name === 'string' &&
          defaultLocation.name.trim() &&
          coordinates &&
          Number.isFinite(coordinates.latitude) &&
          Number.isFinite(coordinates.longitude) &&
          coordinates.latitude >= -90 &&
          coordinates.latitude <= 90 &&
          coordinates.longitude >= -180 &&
          coordinates.longitude <= 180
        ) {
          await this.weatherService.loadWeatherForLocation(
            coordinates.latitude,
            coordinates.longitude,
            defaultLocation.name,
          );
          return;
        }
      } catch (err) {
        console.error('Unable to load the account default location:', err);
      }
    }

    await this.weatherService.loadDefaultLocation();
  }

  toggleForecast() {
    this.isForecastExpanded.update(v => !v);
  }
}
