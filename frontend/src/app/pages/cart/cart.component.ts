import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  readonly items;
  readonly cartSubtotal;
  readonly selectedPharmacy;

  constructor(
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.items = this.cartService.items;
    this.cartSubtotal = this.cartService.cartSubtotal;
    this.selectedPharmacy = this.cartService.selectedPharmacy;
  }

  increaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.medicineId, item.pharmacyId, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.medicineId, item.pharmacyId, item.quantity - 1);
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.medicineId, item.pharmacyId);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: `${item.name} removed from cart`,
      showConfirmButton: false,
      timer: 1500
    });
  }

  getDeliveryFee(): number {
    return this.cartSubtotal() > 500 ? 0 : 40; // Free delivery for orders above ₹500
  }

  getTotal(): number {
    return this.cartSubtotal() + this.getDeliveryFee();
  }

  proceedToCheckout() {
    if (!this.authService.isLoggedIn()) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in or register an account before proceeding to checkout.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Log In',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0d9488'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    this.router.navigate(['/checkout']);
  }
}
