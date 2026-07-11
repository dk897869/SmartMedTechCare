import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

interface TrackingData {
  status: string;
  progress: number;
  deliveryLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  pharmacyLocation: { lat: number; lng: number };
  trackingHistory: Array<{
    status: string;
    message: string;
    timestamp: string;
  }>;
}

@Component({
  selector: 'app-order-tracking',
  imports: [RouterLink, DatePipe],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.scss'
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  orderId = '';
  readonly trackingData = signal<TrackingData | null>(null);
  readonly isLoading = signal(true);
  
  private trackingInterval: any = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.orderId = params['id'];
      if (this.orderId) {
        this.fetchTracking();
        // Start polling coordinates every 4 seconds
        this.trackingInterval = setInterval(() => {
          this.fetchTracking();
        }, 4000);
      }
    });
  }

  fetchTracking() {
    this.apiService.get<any>(`orders/${this.orderId}/track`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.trackingData.set(res.data);
          
          // If delivered or cancelled, clear polling interval
          if (res.data.status === 'Delivered' || res.data.status === 'Cancelled') {
            this.clearPolling();
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.clearPolling();
        Swal.fire({
          title: 'Tracking Interrupted',
          text: 'Unable to sync with live delivery system.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
      }
    });
  }

  clearPolling() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  // Translates latitudes/longitudes of points into standard SVG coordinates (0 to 100)
  getSvgCoords(lat: number, lng: number): { x: number; y: number } {
    const track = this.trackingData();
    if (!track) {
      return { x: 50, y: 50 };
    }

    const allLats = [track.pharmacyLocation.lat, track.destinationLocation.lat, lat];
    const allLngs = [track.pharmacyLocation.lng, track.destinationLocation.lng, lng];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    // Scale to range [15, 85] to leave space on borders
    const x = 15 + ((lng - minLng) / lngSpan) * 70;
    const y = 85 - ((lat - minLat) / latSpan) * 70;

    return { x: Math.round(x), y: Math.round(y) };
  }

  ngOnDestroy() {
    this.clearPolling();
  }
}
