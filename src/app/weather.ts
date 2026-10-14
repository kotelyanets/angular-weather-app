import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';



export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditionText: string;
  theme: 'sunny' | 'rainy' | 'snowy' | 'cloudy';
  timestamp: number;
}



@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private http = inject(HttpClient);
  private CACHE_DURATION = 10 * 60 * 1000;

  getWeather(city: string): Observable<WeatherData> {
    const cacheKey = `weather_${city.trim().toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const parsedData: WeatherData = JSON.parse(cached);
      const isExpired = Date.now() - parsedData.timestamp > this.CACHE_DURATION;

      if (!isExpired) {
        return of(parsedData);
      }
    }



    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`;

    return this.http.get<any>(geoUrl).pipe(
      switchMap((geoRes) => {
        if (!geoRes.results || geoRes.results.length === 0) {
          return throwError(() => new Error('City not found'));
        }

        const location = geoRes.results[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

        return this.http.get<any>(weatherUrl).pipe(
          map((weatherRes) => {
            const current = weatherRes.current;
            const mappedCondition = this.mapWeatherCode(current.weather_code);

            const data: WeatherData = {
              city: location.name,
              country: location.country || '',
              temperature: Math.round(current.temperature_2m),
              humidity: current.relative_humidity_2m,
              windSpeed: current.wind_speed_10m,
              conditionText: mappedCondition.text,
              theme: mappedCondition.theme,
              timestamp: Date.now()
            };

            return data;
          }),
          tap((data) => {
            localStorage.setItem(cacheKey, JSON.stringify(data));
          })
        );
      })
    );
  }


  
  private mapWeatherCode(code: number): { text: string; theme: 'sunny' | 'rainy' | 'snowy' | 'cloudy' } {
    if (code === 0 || code === 1) {
      return { text: 'Sunny / Clear', theme: 'sunny' };
    }
    if (code === 2 || code === 3 || code === 45 || code === 48) {
      return { text: 'Cloudy / Foggy', theme: 'cloudy' };
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
      return { text: 'Rainy', theme: 'rainy' };
    }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      return { text: 'Snowy', theme: 'snowy' };
    }
    return { text: 'Clear', theme: 'sunny' };
  }
}