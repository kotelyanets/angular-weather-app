import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherService, WeatherData } from './weather';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  private weatherService = inject(WeatherService);

  cityName: string = '';
  weather: WeatherData | null = null;
  loading: boolean = false;
  errorMessage: string = '';

  searchWeather() {
    if (!this.cityName.trim()) return;

    this.loading = true;
    this.errorMessage = '';
    this.weather = null;

    this.weatherService.getWeather(this.cityName).subscribe({
      next: (data: WeatherData) => {
        this.weather = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'City not found or network error. Please try again.';
        this.loading = false;
      }
    });
  }
}