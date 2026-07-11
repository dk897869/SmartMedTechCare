import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // Default coordinates (Connaught Place, New Delhi)
  readonly defaultCoords = { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi, Delhi 110001' };
  
  readonly currentCoords = signal<{ lat: number; lng: number; address: string }>(this.defaultCoords);

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
}
