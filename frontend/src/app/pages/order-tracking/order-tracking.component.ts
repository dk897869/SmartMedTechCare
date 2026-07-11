import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DatePipe, CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.scss'
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  orderId = '';
  readonly trackingData = signal<TrackingData | null>(null);
  readonly orderDetails = signal<any>(null);
  readonly isLoading = signal(true);

  private trackingInterval: any = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.orderId = params['id'];
      if (this.orderId) {
        this.fetchOrderDetails();
        this.fetchTracking();
        // Start polling coordinates and status every 4 seconds
        this.trackingInterval = setInterval(() => {
          this.fetchTracking();
          this.fetchOrderDetails();
        }, 4000);
      }
    });
  }

  fetchOrderDetails() {
    this.apiService.get<any>(`orders/${this.orderId}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.orderDetails.set(res.data);
        }
      }
    });
  }

  fetchTracking() {
    this.apiService.get<any>(`orders/${this.orderId}/track`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.trackingData.set(res.data);

          // If delivered or cancelled, clear polling
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
          confirmButtonColor: '#10b981'
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

  callRider(name: string) {
    Swal.fire({
      title: 'Connecting to Rider',
      text: `Calling delivery partner ${name} at +91 98765 43210.`,
      icon: 'success',
      confirmButtonColor: '#10b981'
    });
  }

  shareTracking() {
    Swal.fire({
      title: 'Share Tracking Link',
      text: 'Copy tracking link to clipboard to share delivery status.',
      icon: 'info',
      confirmButtonColor: '#10b981'
    });
  }

  detectOrderGPS() {
    this.fetchTracking();
  }

  // Translates latitudes/longitudes of points into standard SVG grid spaces (0 to 500) x (0 to 350)
  getSvgCoords(lat: number, lng: number): { x: number; y: number } {
    const track = this.trackingData();
    if (!track) {
      return { x: 250, y: 175 };
    }

    const allLats = [track.pharmacyLocation.lat, track.destinationLocation.lat, lat];
    const allLngs = [track.pharmacyLocation.lng, track.destinationLocation.lng, lng];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    // Scale to box bounds: X [70, 440], Y [50, 300]
    const x = 70 + ((lng - minLng) / lngSpan) * 370;
    const y = 300 - ((lat - minLat) / latSpan) * 250;

    return { x: Math.round(x), y: Math.round(y) };
  }

  ngOnDestroy() {
    this.clearPolling();
  }
}