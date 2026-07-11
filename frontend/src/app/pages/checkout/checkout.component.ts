import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  shippingAddress = '';
  paymentMethod = 'Stripe'; // Stripe, Razorpay, COD
  
  // Stripe Card Details Sim
  cardNumber = '';
  cardExpiry = '';
  cardCvc = '';

  // Prescription Upload Sim
  prescriptionFile: File | null = null;
  prescriptionName = '';
  readonly isUploadingPrescription = signal(false);
  readonly prescriptionUploaded = signal(false);

  readonly isPlacingOrder = signal(false);

  readonly items;
  readonly cartSubtotal;
  readonly selectedPharmacy;

  // Computed checks if any item requires prescription
  readonly requiresPrescription;

  constructor(
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly router: Router
  ) {
    this.items = this.cartService.items;
    this.cartSubtotal = this.cartService.cartSubtotal;
    this.selectedPharmacy = this.cartService.selectedPharmacy;

    this.requiresPrescription = computed(() => {
      // If any item contains amoxicillin or requires Rx (we'll look up by name/requiresPrescription details)
      return this.items().some(item => 
        item.name.toLowerCase().includes('amoxicillin') || 
        item.name.toLowerCase().includes('prescription')
      );
    });
  }

  ngOnInit() {
    if (this.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Prefill user location/address if available
    const user = this.authService.currentUser();
    if (user && user.defaultLocation) {
      this.shippingAddress = user.defaultLocation.address || '';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.prescriptionFile = file;
      this.prescriptionName = file.name;
      this.isUploadingPrescription.set(true);
      
      // Simulate file upload
      setTimeout(() => {
        this.isUploadingPrescription.set(false);
        this.prescriptionUploaded.set(true);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Prescription uploaded successfully',
          showConfirmButton: false,
          timer: 2000
        });
      }, 1500);
    }
  }

  getDeliveryFee(): number {
    return this.cartSubtotal() > 500 ? 0 : 40;
  }

  getTotal(): number {
    return this.cartSubtotal() + this.getDeliveryFee();
  }

  submitOrder() {
    if (!this.shippingAddress.trim()) {
      Swal.fire({
        title: 'Missing Address',
        text: 'Please input a delivery shipping address.',
        icon: 'error',
        confirmButtonColor: '#0d9488'
      });
      return;
    }

    if (this.requiresPrescription() && !this.prescriptionUploaded()) {
      Swal.fire({
        title: 'Prescription Required',
        text: 'One or more medicines in your cart require a doctor prescription. Please upload a copy before checking out.',
        icon: 'warning',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Verify Stripe card details
    if (this.paymentMethod === 'Stripe') {
      if (!this.cardNumber || !this.cardExpiry || !this.cardCvc) {
        Swal.fire({
          title: 'Card Details Required',
          text: 'Please fill in all credit card payment fields.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
        return;
      }
    }

    this.isPlacingOrder.set(true);

    // Simulate payment gateway handshakes
    Swal.fire({
      title: `Connecting to ${this.paymentMethod}...`,
      text: 'Processing secure payment transaction. Do not close this window.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      // Group items by pharmacyId
      const groupedItems: { [pharmacyId: string]: any[] } = {};
      for (const item of this.items()) {
        if (!groupedItems[item.pharmacyId]) {
          groupedItems[item.pharmacyId] = [];
        }
        groupedItems[item.pharmacyId].push({
          medicineId: item.medicineId,
          quantity: item.quantity
        });
      }

      const pharmacyIds = Object.keys(groupedItems);
      const orderPromises: Promise<any>[] = [];

      for (const pId of pharmacyIds) {
        const payload = {
          pharmacyId: pId,
          items: groupedItems[pId],
          paymentMethod: this.paymentMethod,
          shippingAddress: this.shippingAddress
        };
        
        const orderPromise = new Promise((resolve, reject) => {
          this.apiService.post<any>('orders', payload).subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
        });
        orderPromises.push(orderPromise);
      }

      Promise.all(orderPromises)
        .then((results: any[]) => {
          Swal.close();
          this.isPlacingOrder.set(false);
          const firstOrderId = results[0]?.data?._id;

          Swal.fire({
            title: 'Payment Successful!',
            text: `Placed ${results.length} order(s) successfully! Preparing your delivery packages.`,
            icon: 'success',
            confirmButtonText: 'Track Order',
            confirmButtonColor: '#10b981'
          }).then(() => {
            this.cartService.clearCart();
            if (firstOrderId) {
              this.router.navigate([`/orders/${firstOrderId}/track`]);
            } else {
              this.router.navigate(['/orders']);
            }
          });
        })
        .catch((err) => {
          Swal.close();
          this.isPlacingOrder.set(false);
          Swal.fire({
            title: 'Order Placement Failed',
            text: err.error?.message || 'Stock limits or connection issues occurred.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
          });
        });
    }, 2500); // 2.5s payment sim
  }
}
