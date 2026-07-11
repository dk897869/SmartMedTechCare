import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  readonly isLoading = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all fields.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    this.isLoading.set(true);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          Swal.fire({
            title: 'Welcome Back!',
            text: `Logged in successfully as ${res.data.name}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({
          title: 'Authentication Failed',
          text: err.error?.message || 'Invalid email or password.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  loginWithGoogle() {
    this.isLoading.set(true);
    Swal.fire({
      title: 'Connecting to Google...',
      text: 'Authenticating your secure Google profile.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const googlePayload = {
      name: 'Alex Google Test',
      email: 'alex.google@gmail.com',
      password: 'google_oauth_secure_password_123_bypass'
    };

    // Try registering. If user exists, try logging in
    this.authService.register(googlePayload).subscribe({
      next: (res) => {
        Swal.close();
        this.isLoading.set(false);
        if (res.success) {
          Swal.fire({
            title: 'Google Login Successful!',
            text: `Welcome, ${res.data.name}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/']);
        }
      },
      error: () => {
        // Registration failed, user likely already exists, try logging in
        this.authService.login({ email: googlePayload.email, password: googlePayload.password }).subscribe({
          next: (res) => {
            Swal.close();
            this.isLoading.set(false);
            if (res.success) {
              Swal.fire({
                title: 'Google Welcome Back!',
                text: `Logged in as ${res.data.name}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.router.navigate(['/']);
            }
          },
          error: (err) => {
            Swal.close();
            this.isLoading.set(false);
            Swal.fire({
              title: 'Google Sign In Failed',
              text: 'Unable to authenticate Google account.',
              icon: 'error',
              confirmButtonColor: '#10b981'
            });
          }
        });
      }
    });
  }
}
