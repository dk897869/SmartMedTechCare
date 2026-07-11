import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LocationService } from '../../services/location.service';
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './nearby-pharmacies.component.html',
  styleUrl: './nearby-pharmacies.component.scss'
})
export class NearbyPharmaciesComponent implements OnInit {
  readonly pharmacies = signal<Pharmacy[]>([]);
  readonly selectedPharmacy = signal<Pharmacy | null>(null);
  
  readonly isLoading = signal(true);
  readonly userCoords;
  
  // Search and Radius states
  readonly searchQuery = signal('');
  readonly searchRadius = signal(10); // default 10 km
  readonly useCurrentLocation = signal(true);
  
  // Quick filters states
  readonly openNowFilter = signal(false);
  readonly twentyFourSevenFilter = signal(false);
  readonly deliveryFilter = signal(false);
  readonly prescriptionFilter = signal(false);

  // Map settings
  readonly mapMode = signal<'map' | 'satellite'>('map');
  readonly zoomLevel = signal(1.0);

  // Select dropdown bindings
  selectedState = 'Punjab';
  selectedCity = 'Mohali';
  selectedArea = 'Sector 70';
  selectedSector = 'All Sectors';
  selectedPincode = '160071';

  // Mock Selector Data
  states = ['Punjab', 'Delhi', 'Chandigarh', 'Maharashtra'];
  
  citiesMap: { [key: string]: string[] } = {
    'Punjab': ['Mohali', 'Ludhiana'],
    'Delhi': ['New Delhi (Connaught Place)'],
    'Chandigarh': ['Chandigarh Sector 35'],
    'Maharashtra': ['Mumbai', 'Pune']
  };

  areasMap: { [key: string]: string[] } = {
    'Mohali': ['Sector 70', 'Sector 71', 'Phase 8', 'Sector 66'],
    'Ludhiana': ['Civil Lines', 'Model Town'],
    'New Delhi (Connaught Place)': ['Connaught Place', 'Janpath'],
    'Chandigarh Sector 35': ['Sector 35', 'Sector 34'],
    'Mumbai': ['Bandra', 'Colaba'],
    'Pune': ['Kothrud', 'Hinjewadi']
  };

  sectors = ['All Sectors', 'Sector 70', 'Sector 71', 'Sector 69', 'Phase 8', 'Phase 7'];
  pincodes = ['160071', '160062', '160055', '110001', '400001'];

  constructor(
    private readonly apiService: ApiService,
    readonly locationService: LocationService,
    private readonly router: Router
  ) {
    this.userCoords = this.locationService.currentCoords;
  }

  ngOnInit() {
    this.detectAndFetch();
  }

  // Real-time computed filtering
  readonly filteredPharmacies = computed(() => {
    let list = this.pharmacies();
    const query = this.searchQuery().toLowerCase().trim();
    const radius = this.searchRadius();
    
    // Quick filters
    const filterOpen = this.openNowFilter();
    const filter24 = this.twentyFourSevenFilter();
    const filterDel = this.deliveryFilter();
    const filterRx = this.prescriptionFilter();

    // 1. Text Search query (Name, Address)
    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query)
      );
    }

    // 2. Radius Slider
    list = list.filter(p => p.distance <= radius);

    // 3. Quick Filters simulations
    if (filterOpen) {
      list = list.filter(p => !p.name.includes("Netmeds"));
    }
    if (filter24) {
      list = list.filter(p => p.name.includes("Wellness"));
    }
    if (filterDel) {
      list = list.filter(p => !p.name.includes("Netmeds"));
    }
    if (filterRx) {
      list = list.filter(p => p.name.includes("Apollo") || p.name.includes("Wellness"));
    }

    return list;
  });

  // Dynamic statistics summaries
  readonly totalPharmaciesCount = computed(() => this.filteredPharmacies().length);
  readonly nearestDistanceText = computed(() => {
    const list = this.filteredPharmacies();
    return list.length > 0 ? `${list[0].distance} km away` : 'N/A';
  });
  readonly nearestNameText = computed(() => {
    const list = this.filteredPharmacies();
    return list.length > 0 ? list[0].name : 'N/A';
  });

  onStateChange(state: string) {
    this.selectedState = state;
    const cityList = this.citiesMap[state] || [];
    if (cityList.length > 0) {
      this.onCityChange(cityList[0]);
    }
  }

  onCityChange(city: string) {
    this.selectedCity = city;
    this.locationService.selectCity(city);
    const coords = this.userCoords();
    
    // Auto-update areas
    const areaList = this.areasMap[city] || [];
    if (areaList.length > 0) {
      this.selectedArea = areaList[0];
    }
    this.fetchPharmacies(coords.lat, coords.lng);
  }

  detectAndFetch() {
    this.isLoading.set(true);
    if (this.useCurrentLocation()) {
      this.locationService.detectLocation().then((coords) => {
        this.fetchPharmacies(coords.lat, coords.lng);
      });
    } else {
      // Fallback to dropdown selected city
      this.locationService.selectCity(this.selectedCity);
      const coords = this.userCoords();
      this.fetchPharmacies(coords.lat, coords.lng);
    }
  }

  onLocationToggleChange() {
    this.useCurrentLocation.set(!this.useCurrentLocation());
    this.detectAndFetch();
  }

  fetchPharmacies(lat: number, lng: number) {
    this.apiService.get<any>('pharmacies/nearby', { lat, lng }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.pharmacies.set(res.data);
          if (res.data.length > 0) {
            this.selectedPharmacy.set(res.data[0]); // default select nearest
          } else {
            this.selectedPharmacy.set(null);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({
          title: 'Store Query Failed',
          text: 'Failed to search for pharmacies. Make sure the backend server is running.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  selectPharmacy(pharmacy: Pharmacy) {
    this.selectedPharmacy.set(pharmacy);
  }

  toggleQuickFilter(filterType: string) {
    if (filterType === 'open') this.openNowFilter.set(!this.openNowFilter());
    if (filterType === '24x7') this.twentyFourSevenFilter.set(!this.twentyFourSevenFilter());
    if (filterType === 'delivery') this.deliveryFilter.set(!this.deliveryFilter());
    if (filterType === 'rx') this.prescriptionFilter.set(!this.prescriptionFilter());
  }

  setMapMode(mode: 'map' | 'satellite') {
    this.mapMode.set(mode);
  }

  zoomIn() {
    this.zoomLevel.update(z => Math.min(z + 0.2, 2.0));
  }

  zoomOut() {
    this.zoomLevel.update(z => Math.max(z - 0.2, 0.6));
  }

  viewMedicinesOfSelected() {
    const selected = this.selectedPharmacy();
    if (selected) {
      this.router.navigate(['/medicines']);
    }
  }

  triggerDirections(name: string) {
    Swal.fire({
      title: 'Routing Directions',
      text: `Navigating path coordinates from current location to ${name}.`,
      icon: 'info',
      confirmButtonColor: '#10b981'
    });
  }

  triggerCall(phone: string) {
    Swal.fire({
      title: 'Dialing Pharmacy',
      text: `Connecting live audio call to ${phone}.`,
      icon: 'success',
      confirmButtonColor: '#10b981'
    });
  }

  // Returns SVG plot positions mapping the grid coordinate spaces
  getMapCoords(name: string): { x: number; y: number } {
    if (name.includes("Apollo")) return { x: 280, y: 110 };
    if (name.includes("MedPlus")) return { x: 370, y: 140 };
    if (name.includes("Wellness")) return { x: 390, y: 220 };
    if (name.includes("Netmeds")) return { x: 300, y: 250 };
    return { x: 280, y: 110 };
  }

  getPinColor(name: string): string {
    if (name.includes("Apollo")) return "#10b981"; // Green
    if (name.includes("MedPlus")) return "#ef4444"; // Red
    if (name.includes("Wellness")) return "#f97316"; // Orange
    return "#0ea5e9"; // Blue
  }
}
