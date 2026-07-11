import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LocationService } from '../../services/location.service';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  contact: string;
  rating: number;
  distance: number;
}

@Component({
  selector: 'app-nearby-pharmacies',
  imports: [RouterLink],
  templateUrl: './nearby-pharmacies.component.html',
  styleUrl: './nearby-pharmacies.component.scss'
})
export class NearbyPharmaciesComponent implements OnInit {
  readonly pharmacies = signal<Pharmacy[]>([]);
  readonly selectedPharmacy = signal<Pharmacy | null>(null);
  
  readonly isLoading = signal(true);
  readonly userCoords;

  constructor(
    private readonly apiService: ApiService,
    private readonly locationService: LocationService
  ) {
    this.userCoords = this.locationService.currentCoords;
  }

  ngOnInit() {
    this.detectAndFetch();
  }

  detectAndFetch() {
    this.isLoading.set(true);
    this.locationService.detectLocation().then((coords) => {
      this.fetchPharmacies(coords.lat, coords.lng);
    });
  }

  fetchPharmacies(lat: number, lng: number) {
    this.apiService.get<any>('pharmacies/nearby', { lat, lng }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.pharmacies.set(res.data);
          if (res.data.length > 0) {
            this.selectedPharmacy.set(res.data[0]); // default select nearest
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({
          title: 'Store Query Failed',
          text: 'Failed to search for pharmacies. Make sure the backend server is running.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
      }
    });
  }

  selectPharmacy(pharmacy: Pharmacy) {
    this.selectedPharmacy.set(pharmacy);
  }

  // Calculate coordinates mapping for SVG drawing box: [minLat, maxLat, minLng, maxLng]
  // Translates latitudes/longitudes into standard SVG coordinates (0 to 100)
  getSvgCoords(lat: number, lng: number): { x: number; y: number } {
    const list = this.pharmacies();
    const uCoords = this.userCoords();

    if (list.length === 0) {
      return { x: 50, y: 50 };
    }

    // Include user coordinate in bounding calculation
    const allLats = [...list.map((p) => p.location.lat), uCoords.lat];
    const allLngs = [...list.map((p) => p.location.lng), uCoords.lng];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    // Map longitudes to X (10% to 90% space), latitudes to Y (inverted, 10% to 90% space)
    const x = 10 + ((lng - minLng) / lngSpan) * 80;
    const y = 90 - ((lat - minLat) / latSpan) * 80;

    return { x: Math.round(x), y: Math.round(y) };
  }
}
