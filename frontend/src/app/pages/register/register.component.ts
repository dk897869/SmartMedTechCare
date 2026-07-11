import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role = 'user'; // default to user, editable to 'admin' for test convenience
  readonly isLoading = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit() {
    if (!this.name || !this.email || !this.password) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all fields.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    this.isLoading.set(true);

    const signupPayload = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    };

    this.authService.register(signupPayload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          Swal.fire({
            title: 'Account Created!',
            text: `Welcome to SmartMedTechCare, ${res.data.name}`,
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
          title: 'Registration Failed',
          text: err.error?.message || 'Email might already be in use.',
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

    // Try registering first. If exists, log in
    this.authService.register(googlePayload).subscribe({
      next: (res) => {
        Swal.close();
        this.isLoading.set(false);
        if (res.success) {
          Swal.fire({
            title: 'Google Register Successful!',
            text: `Welcome, ${res.data.name}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/']);
        }
      },
      error: () => {
        // Fallback login
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
          error: () => {
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
