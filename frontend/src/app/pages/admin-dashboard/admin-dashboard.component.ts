import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

interface DashboardStats {
  counts: {
    users: number;
    medicines: number;
    pharmacies: number;
    orders: number;
    revenue: number;
  };
  statusCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

interface Order {
  _id: string;
  createdAt: string;
  userId: {
    name: string;
    email: string;
  };
  pharmacyId: {
    name: string;
  };
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

interface Medicine {
  _id: string;
  name: string;
}

interface Pharmacy {
  _id: string;
  name: string;
}

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  readonly stats = signal<DashboardStats | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly medicines = signal<Medicine[]>([]);
  readonly pharmacies = signal<Pharmacy[]>([]);
  readonly contacts = signal<ContactQuery[]>([]);
  
  readonly isLoading = signal(true);

  // Inventory form inputs
  selectedPharmacyId = '';
  selectedMedicineId = '';
  priceUpdate = 0;
  stockUpdate = 0;

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    // Role Authorization Guard Check
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You must have pharmacist or admin privileges to enter this page.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      this.router.navigate(['/']);
      return;
    }

    this.fetchDashboardStats();
    this.fetchOrders();
    this.fetchMedicinesAndPharmacies();
    this.fetchContactQueries();
  }

  fetchDashboardStats() {
    this.isLoading.set(true);
    this.apiService.get<any>('admin/stats').subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.stats.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  fetchOrders() {
    this.apiService.get<any>('admin/orders').subscribe({
      next: (res) => {
        if (res.success) {
          this.orders.set(res.data);
        }
      }
    });
  }

  fetchContactQueries() {
    this.apiService.get<any>('contacts').subscribe({
      next: (res) => {
        if (res.success) {
          this.contacts.set(res.data);
        }
      }
    });
  }

  fetchMedicinesAndPharmacies() {
    this.apiService.get<any>('medicines').subscribe({
      next: (res) => {
        if (res.success) this.medicines.set(res.data);
      }
    });

    // Fetch CP pharmacies for select options
    this.apiService.get<any>('pharmacies/nearby', { lat: 28.6139, lng: 77.2090 }).subscribe({
      next: (res) => {
        if (res.success) this.pharmacies.set(res.data);
      }
    });
  }

  updateOrderStatus(orderId: string, status: string) {
    Swal.fire({
      title: 'Update Status?',
      text: `Are you sure you want to shift this order's status to ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      confirmButtonColor: '#10b981'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.put<any>(`admin/orders/${orderId}/status`, { status }).subscribe({
          next: (res) => {
            if (res.success) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Order status updated',
                showConfirmButton: false,
                timer: 1500
              });
              this.fetchOrders();
              this.fetchDashboardStats();
            }
          }
        });
      }
    });
  }

  submitInventoryUpdate() {
    if (!this.selectedPharmacyId || !this.selectedMedicineId) {
      Swal.fire({
        title: 'Form Incomplete',
        text: 'Please select both a pharmacy and a medicine.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const payload = {
      pharmacyId: this.selectedPharmacyId,
      medicineId: this.selectedMedicineId,
      price: this.priceUpdate,
      stock: this.stockUpdate
    };

    this.apiService.put<any>('admin/inventory', payload).subscribe({
      next: (res) => {
        if (res.success) {
          Swal.fire({
            title: 'Inventory Updated!',
            text: 'Pricing and stock variations are now active in the client comparison sheets.',
            icon: 'success',
            confirmButtonColor: '#10b981'
          });
          // Reset form fields
          this.selectedMedicineId = '';
          this.priceUpdate = 0;
          this.stockUpdate = 0;
        }
      },
      error: (err) => {
        Swal.fire({
          title: 'Update Failed',
          text: err.error?.message || 'Inventory update failed.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }
}
