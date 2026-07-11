import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import Swal from 'sweetalert2';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  activeIngredients: string[];
  sideEffects: string[];
  dosageGuidance: string;
  requiresPrescription: boolean;
  image: string;
}

interface PriceListing {
  _id: string;
  pharmacyId: {
    _id: string;
    name: string;
    address: string;
    contact: string;
    rating: number;
  };
  price: number;
  stock: number;
  isAvailable: boolean;
}

@Component({
  selector: 'app-medicine-details',
  imports: [RouterLink],
  templateUrl: './medicine-details.component.html',
  styleUrl: './medicine-details.component.scss'
})
export class MedicineDetailsComponent implements OnInit {
  readonly medicine = signal<Medicine | null>(null);
  readonly listings = signal<PriceListing[]>([]);
  
  readonly isLoading = signal(true);
  readonly isLoadingPrices = signal(true);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly cartService: CartService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.fetchMedicineDetails(id);
        this.fetchPriceListings(id);
      }
    });
  }

  fetchMedicineDetails(id: string) {
    this.isLoading.set(true);
    this.apiService.get<any>(`medicines/${id}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.medicine.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  fetchPriceListings(id: string) {
    this.isLoadingPrices.set(true);
    this.apiService.get<any>(`medicines/${id}/compare`).subscribe({
      next: (res) => {
        this.isLoadingPrices.set(false);
        if (res.success) {
          this.listings.set(res.data);
        }
      },
      error: () => {
        this.isLoadingPrices.set(false);
      }
    });
  }

  addToCart(listing: PriceListing) {
    const med = this.medicine();
    if (!med) return;

    if (listing.stock <= 0) {
      Swal.fire({
        title: 'Out of Stock',
        text: 'This pharmacy does not have sufficient stock at this moment.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    // Deduct stock locally in real-time
    listing.stock -= 1;

    this.cartService.addToCart(med, listing.price, listing.pharmacyId);
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${med.name} added to cart from ${listing.pharmacyId.name}`,
      showConfirmButton: false,
      timer: 2000
    });
  }
}
