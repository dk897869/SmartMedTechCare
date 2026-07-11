import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // Default coordinates (Connaught Place, New Delhi)
  readonly defaultCoords = { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi, Delhi 110001' };
  
  readonly currentCoords = signal<{ lat: number; lng: number; address: string }>(this.defaultCoords);

  readonly statesAndCities = [
    {
      state: 'Delhi',
      cities: [
        { name: 'New Delhi (Connaught Place)', lat: 28.6139, lng: 77.2090 }
      ]
    },
    {
      state: 'Punjab',
      cities: [
        { name: 'Mohali', lat: 30.7000, lng: 76.6918 },
        { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 }
      ]
    },
    {
      state: 'Chandigarh',
      cities: [
        { name: 'Chandigarh Sector 35', lat: 30.7300, lng: 76.7700 }
      ]
    },
    {
      state: 'Maharashtra',
      cities: [
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
        { name: 'Pune', lat: 18.5204, lng: 73.8567 }
      ]
    }
  ];

  constructor() {
    this.detectLocation();
  }

  detectLocation(): Promise<{ lat: number; lng: number; address: string }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        console.log('🌐 Geolocation is not supported by this browser.');
        resolve(this.defaultCoords);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Detected Live Location'
          };
          this.currentCoords.set(coords);
          console.log('🌐 Live Location detected:', coords);
          resolve(coords);
        },
        (error) => {
          console.warn('🌐 Geolocation access denied or failed. Using fallback:', error.message);
          resolve(this.defaultCoords);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  updateManualLocation(lat: number, lng: number, address: string) {
    this.currentCoords.set({ lat, lng, address });
  }

  selectCity(cityName: string) {
    for (const stateObj of this.statesAndCities) {
      const city = stateObj.cities.find(c => c.name === cityName);
      if (city) {
        this.updateManualLocation(city.lat, city.lng, `${city.name}, ${stateObj.state}`);
        break;
      }
    }
  }
}
