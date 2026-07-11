import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'symptoms',
    loadComponent: () => import('./pages/symptom-checker/symptom-checker.component').then(m => m.SymptomCheckerComponent)
  },
  {
    path: 'medicines',
    loadComponent: () => import('./pages/medicine-comparison/medicine-comparison.component').then(m => m.MedicineComparisonComponent)
  },
  {
    path: 'medicines/:id',
    loadComponent: () => import('./pages/medicine-details/medicine-details.component').then(m => m.MedicineDetailsComponent)
  },
  {
    path: 'pharmacies',
    loadComponent: () => import('./pages/nearby-pharmacies/nearby-pharmacies.component').then(m => m.NearbyPharmaciesComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'orders/:id/track',
    loadComponent: () => import('./pages/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
