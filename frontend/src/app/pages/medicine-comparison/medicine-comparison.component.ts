import { Component, OnInit, signal, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import Swal from 'sweetalert2';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image: string;
  requiresPrescription: boolean;
}

interface PriceListing {
  _id: string;
  pharmacyId: {
    _id: string;
    name: string;
    address: string;
    contact: string;
    rating: number;
    location: { lat: number; lng: number };
  };
  price: number;
  stock: number;
  isAvailable: boolean;
}

@Component({
  selector: 'app-medicine-comparison',
  imports: [FormsModule, RouterLink],
  templateUrl: './medicine-comparison.component.html',
  styleUrl: './medicine-comparison.component.scss'
})
export class MedicineComparisonComponent implements OnInit {
  searchQuery = '';
  selectedCategory = '';
  
  readonly medicines = signal<Medicine[]>([]);
  readonly listings = signal<PriceListing[]>([]);
  readonly selectedMedicine = signal<Medicine | null>(null);
  
  readonly isLoading = signal(false);
  readonly isComparing = signal(false);

  readonly categories = ['Pain Reliever', 'Antacid', 'Allergy', 'Antibiotics'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly cartService: CartService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.searchQuery = params['query'] || '';
      this.fetchMedicines();
    });
  }

  fetchMedicines() {
    this.isLoading.set(true);
    this.selectedMedicine.set(null);
    this.listings.set([]);

    const params: Record<string, string> = {};
    if (this.searchQuery) params['query'] = this.searchQuery;
    if (this.selectedCategory) params['category'] = this.selectedCategory;

    this.apiService.get<any>('medicines', params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.medicines.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.fetchMedicines();
  }

  comparePrices(medicine: Medicine) {
    this.selectedMedicine.set(medicine);
    this.isComparing.set(true);

    this.apiService.get<any>(`medicines/${medicine._id}/compare`).subscribe({
      next: (res) => {
        this.isComparing.set(false);
        if (res.success) {
          this.listings.set(res.data);
        }
      },
      error: () => {
        this.isComparing.set(false);
        Swal.fire({
          title: 'Comparison Error',
          text: 'Failed to retrieve pharmacy pricing comparison data.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
      }
    });
  }

  addToCart(med: Medicine, listing: PriceListing) {
    if (listing.stock <= 0) {
      Swal.fire({
        title: 'Out of Stock',
        text: 'This pharmacy does not have sufficient stock at this moment.',
        icon: 'error',
        confirmButtonColor: '#0d9488'
      });
      return;
    }

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
