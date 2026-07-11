import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';

export interface UserResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
    defaultLocation?: any;
    profile?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal containing the current user profile or data
  readonly currentUser = signal<any | null>(null);

  // Computeds
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private readonly api: ApiService) {
    this.loadCachedUser();
  }

  private loadCachedUser() {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          this.currentUser.set(JSON.parse(cached));
        } catch {
          this.logout();
        }
      }
    }
  }

  register(userData: any): Observable<UserResponse> {
    return this.api.post<UserResponse>('auth/register', userData).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      })
    );
  }

  login(credentials: any): Observable<UserResponse> {
    return this.api.post<UserResponse>('auth/login', credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      })
    );
  }

  getProfile(): Observable<any> {
    return this.api.get<any>('auth/profile').pipe(
      tap((res) => {
        if (res.success && res.data) {
          // Merge token from existing session
          const updatedUser = {
            ...res.data,
            token: this.currentUser()?.token
          };
          this.currentUser.set(updatedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      })
    );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.api.put<any>('auth/profile', profileData).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const updatedUser = {
            ...res.data,
            token: this.currentUser()?.token
          };
          this.currentUser.set(updatedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      })
    );
  }

  private saveSession(userData: any) {
    this.currentUser.set(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }

  logout() {
    this.currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}
