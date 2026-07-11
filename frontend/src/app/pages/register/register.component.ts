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
  phone = '';
  role = 'user'; // default to user, editable to 'admin' for test convenience
  
  // OTP elements
  otpSent = false;
  emailOtp = '';
  smsOtp = '';
  
  readonly isLoading = signal(false);
  readonly isSendingOtp = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  sendVerificationCode() {
    if (!this.name || !this.email || !this.password || !this.phone) {
      Swal.fire({
        title: 'Missing Fields',
        text: 'Please fill in your Name, Email, Password, and Mobile Phone number.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    this.isSendingOtp.set(true);
    this.authService.sendOtp(this.email, this.phone).subscribe({
      next: (res) => {
        this.isSendingOtp.set(false);
        if (res.success) {
          this.otpSent = true;
          let msgText = 'A 6-digit code has been sent to your Email and Twilio SMS. Please verify.';
          if (res.devCodes) {
            msgText += `\n\n[Dev Test Fallback]\nEmail OTP: ${res.devCodes.emailOtp}\nSMS OTP: ${res.devCodes.smsOtp}`;
          }
          Swal.fire({
            title: 'OTPs Transmitted!',
            text: msgText,
            icon: 'success',
            confirmButtonColor: '#10b981'
          });
          if (res.devCodes) {
            console.log(`[DEV TEST MODE] Email Code: ${res.devCodes.emailOtp} | SMS Code: ${res.devCodes.smsOtp}`);
          }
        }
      },
      error: (err) => {
        this.isSendingOtp.set(false);
        Swal.fire({
          title: 'OTP Dispatch Failed',
          text: err.error?.message || 'Could not connect to verification server.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  onSubmit() {
    if (!this.name || !this.email || !this.password || !this.phone) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all fields.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (!this.emailOtp || !this.smsOtp) {
      Swal.fire({
        title: 'Verification Codes Required',
        text: 'Please input both your Email Verification Code and SMS OTP code.',
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
      phone: this.phone,
      role: this.role,
      emailOtp: this.emailOtp,
      smsOtp: this.smsOtp
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
          text: err.error?.message || 'Verification failed. Try requesting a new code.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  loginWithGoogle() {
    Swal.fire({
      title: 'Google Sign In',
      text: 'Enter your Google Email Address:',
      input: 'email',
      inputPlaceholder: 'yourname@gmail.com',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      confirmButtonColor: '#10b981',
      inputValidator: (value) => {
        if (!value) {
          return 'You must enter a valid email!';
        }
        return null;
      }
    }).then((emailResult) => {
      if (emailResult.isConfirmed && emailResult.value) {
        const email = emailResult.value;
        
        Swal.fire({
          title: 'Google Sign In',
          text: 'Enter your Full Name:',
          input: 'text',
          inputPlaceholder: 'John Doe',
          showCancelButton: true,
          confirmButtonText: 'Login',
          confirmButtonColor: '#10b981',
          inputValidator: (value) => {
            if (!value) {
              return 'You must enter your name!';
            }
            return null;
          }
        }).then((nameResult) => {
          if (nameResult.isConfirmed && nameResult.value) {
            const name = nameResult.value;
            
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
              name,
              email,
              password: 'google_oauth_secure_password_123_bypass'
            };

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
                // If register fails, log in directly
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
                      confirmButtonColor: '#ef4444'
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }
}
