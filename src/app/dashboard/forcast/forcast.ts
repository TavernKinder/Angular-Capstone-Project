import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Weather } from '../../shared/services/weather/weather';

@Component({
  selector: 'app-forcast',
  imports: [CommonModule],
  templateUrl: './forcast.html',
  styleUrl: './forcast.css',
})
export class Forcast implements OnInit {
  public weatherService = inject(Weather);

  ngOnInit(): void {
    // Load weather data when component initializes
    this.weatherService.loadWeatherForCurrentLocation();
  }
}
