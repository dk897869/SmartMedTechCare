import { Injectable, signal, computed, effect } from '@angular/core';

export interface CartItem {
  medicineId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly selectedPharmacy = signal<any | null>(null);

  // Computeds
  readonly cartCount = computed(() => {
    return this.items().reduce((acc, item) => acc + item.quantity, 0);
  });

  readonly cartSubtotal = computed(() => {
    return this.items().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  constructor() {
    this.loadCart();

    // Effect to sync cart with localStorage whenever it changes
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(this.items()));
        localStorage.setItem('cartPharmacy', JSON.stringify(this.selectedPharmacy()));
      }
    });
  }

  private loadCart() {
    if (typeof window !== 'undefined') {
      const cachedItems = localStorage.getItem('cart');
      const cachedPharm = localStorage.getItem('cartPharmacy');
      
      if (cachedItems) {
        try {
          this.items.set(JSON.parse(cachedItems));
        } catch {
          this.items.set([]);
        }
      }
      
      if (cachedPharm) {
        try {
          this.selectedPharmacy.set(JSON.parse(cachedPharm));
        } catch {
          this.selectedPharmacy.set(null);
        }
      }
    }
  }

  addToCart(medicine: any, price: number, pharmacy: any) {
    // If pharmacy changes, clear existing cart items from previous pharmacy
    if (this.selectedPharmacy() && this.selectedPharmacy()._id !== pharmacy._id) {
      this.clearCart();
    }
    
    this.selectedPharmacy.set(pharmacy);

    const currentItems = this.items();
    const existingIndex = currentItems.findIndex(item => item.medicineId === medicine._id);

    if (existingIndex > -1) {
      const updated = [...currentItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      this.items.set(updated);
    } else {
      this.items.set([
        ...currentItems,
        {
          medicineId: medicine._id,
          name: medicine.name,
          brand: medicine.brand,
          image: medicine.image,
          price,
          quantity: 1
        }
      ]);
    }
  }

  removeFromCart(medicineId: string) {
    const updated = this.items().filter(item => item.medicineId !== medicineId);
    this.items.set(updated);
    
    if (updated.length === 0) {
      this.selectedPharmacy.set(null);
    }
  }

  updateQuantity(medicineId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(medicineId);
      return;
    }

    const updated = this.items().map(item => {
      if (item.medicineId === medicineId) {
        return { ...item, quantity };
      }
      return item;
    });
    this.items.set(updated);
  }

  clearCart() {
    this.items.set([]);
    this.selectedPharmacy.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
      localStorage.removeItem('cartPharmacy');
    }
  }
}
