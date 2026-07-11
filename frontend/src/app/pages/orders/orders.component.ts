import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

interface Order {
  _id: string;
  createdAt: string;
  pharmacyId: {
    _id: string;
    name: string;
    contact: string;
  };
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

@Component({
  selector: 'app-orders',
  imports: [RouterLink, DatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(true);

  constructor(private readonly apiService: ApiService) {}

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.isLoading.set(true);
    this.apiService.get<any>('orders/myorders').subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.orders.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'badge-warning';
      case 'Processing': return 'badge-info';
      case 'Shipped': return 'badge-info'; // Blue/purple-ish
      case 'Delivered': return 'badge-success';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
