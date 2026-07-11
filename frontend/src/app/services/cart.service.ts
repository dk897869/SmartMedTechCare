import { Injectable, signal, computed, effect } from '@angular/core';

export interface CartItem {
  medicineId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  readonly items = signal<CartItem[]>([]);

  // Computeds
  readonly cartCount = computed(() => {
    return this.items().reduce((acc, item) => acc + item.quantity, 0);
  });

  readonly cartSubtotal = computed(() => {
    return this.items().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  // Backward compatibility fallback to first item's pharmacy
  readonly selectedPharmacy = computed(() => {
    const list = this.items();
    if (list.length === 0) return null;
    return {
      _id: list[0].pharmacyId,
      name: list[0].pharmacyName,
      address: list[0].pharmacyAddress || ''
    };
  });

  constructor() {
    this.loadCart();

    // Effect to sync cart with localStorage whenever it changes
    effect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(this.items()));
      }
    });
  }

  private loadCart() {
    if (typeof window !== 'undefined') {
      const cachedItems = localStorage.getItem('cart');
      if (cachedItems) {
        try {
          this.items.set(JSON.parse(cachedItems));
        } catch {
          this.items.set([]);
        }
      }
    }
  }

  addToCart(medicine: any, price: number, pharmacy: any) {
    const currentItems = this.items();
    
    // Find item matching both medicine ID and pharmacy ID
    const existingIndex = currentItems.findIndex(item => 
      item.medicineId === medicine._id && item.pharmacyId === pharmacy._id
    );

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
          quantity: 1,
          pharmacyId: pharmacy._id,
          pharmacyName: pharmacy.name,
          pharmacyAddress: pharmacy.address || ''
        }
      ]);
    }
  }

  removeFromCart(medicineId: string, pharmacyId: string) {
    const updated = this.items().filter(item => 
      !(item.medicineId === medicineId && item.pharmacyId === pharmacyId)
    );
    this.items.set(updated);
  }

  updateQuantity(medicineId: string, pharmacyId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(medicineId, pharmacyId);
      return;
    }

    const updated = this.items().map(item => {
      if (item.medicineId === medicineId && item.pharmacyId === pharmacyId) {
        return { ...item, quantity };
      }
      return item;
    });
    this.items.set(updated);
  }

  clearCart() {
    this.items.set([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
  }
}
