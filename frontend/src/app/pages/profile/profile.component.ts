import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface Reminder {
  medicineName: string;
  dosage: string;
  time: string;
  frequency: string;
  active: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  name = '';
  email = '';
  password = ''; // leave blank if no change
  profilePhoto = ''; // base64 string
  
  // Health profile metrics
  age = 0;
  weight = 0;
  height = 0;
  bloodGroup = '';
  allergiesText = '';
  
  // Alarms/Reminders list
  reminders: Reminder[] = [];
  
  // Add reminder inputs
  newMedicineName = '';
  newDosage = '';
  newTime = '08:00';
  
  readonly isSaving = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const user = res.data;
          this.name = user.name || '';
          this.email = user.email || '';
          this.profilePhoto = user.profilePhoto || '';
          this.age = user.profile?.age || 0;
          this.weight = user.profile?.weight || 0;
          this.height = user.profile?.height || 0;
          this.bloodGroup = user.profile?.bloodGroup || '';
          this.allergiesText = user.profile?.allergies?.join(', ') || '';
          this.reminders = user.profile?.medicationReminders || [];
        }
      }
    });
  }

  // Handle Photo Select and compress to 10-50 KB
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          this.compressImage(img, (compressedBase64) => {
            this.profilePhoto = compressedBase64;
          });
        };
      };
      reader.readAsDataURL(file);
    }
  }

  // HTML5 Canvas dynamic jpeg quality scaling to fit strictly between 10KB and 50KB
  compressImage(img: HTMLImageElement, callback: (base64: string) => void) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale down dimensions to fit a nice circular profile avatar box
    let width = img.width;
    let height = img.height;
    const maxDim = 320;
    
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(img, 0, 0, width, height);

    let quality = 0.6; // initial quality
    let base64 = canvas.toDataURL('image/jpeg', quality);
    let sizeInKb = (base64.length * 0.75) / 1024;
    
    console.log(`📸 Pre-compression: ${sizeInKb.toFixed(2)} KB`);

    // Perform linear step compression adjustment
    if (sizeInKb > 50) {
      while (sizeInKb > 50 && quality > 0.1) {
        quality -= 0.08;
        base64 = canvas.toDataURL('image/jpeg', quality);
        sizeInKb = (base64.length * 0.75) / 1024;
      }
    } else if (sizeInKb < 10) {
      while (sizeInKb < 10 && quality < 0.95) {
        quality += 0.08;
        base64 = canvas.toDataURL('image/jpeg', quality);
        sizeInKb = (base64.length * 0.75) / 1024;
      }
    }

    console.log(`📸 Output Compression: Size: ${sizeInKb.toFixed(2)} KB | Quality: ${quality.toFixed(2)}`);
    callback(base64);
  }

  saveProfile() {
    this.isSaving.set(true);

    const allergiesArray = this.allergiesText
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const profilePayload: any = {
      name: this.name,
      profile: {
        age: this.age,
        weight: this.weight,
        height: this.height,
        bloodGroup: this.bloodGroup,
        allergies: allergiesArray,
        medicationReminders: this.reminders
      }
    };

    if (this.password.trim()) {
      profilePayload.password = this.password.trim();
    }

    if (this.profilePhoto) {
      profilePayload.profilePhoto = this.profilePhoto;
    }

    this.authService.updateProfile(profilePayload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.password = ''; // clear password input field
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Health profile updated successfully',
            showConfirmButton: false,
            timer: 2000
          });
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        Swal.fire({
          title: 'Update Failed',
          text: err.error?.message || 'Unable to update profile settings.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  addReminder() {
    if (!this.newMedicineName.trim()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please input a medicine name.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const newReminder: Reminder = {
      medicineName: this.newMedicineName,
      dosage: this.newDosage || '1 tablet',
      time: this.newTime,
      frequency: 'Daily',
      active: true
    };

    this.reminders.push(newReminder);
    
    // Clear inputs
    this.newMedicineName = '';
    this.newDosage = '';
    this.newTime = '08:00';
    
    this.saveProfile();
  }

  removeReminder(index: number) {
    this.reminders.splice(index, 1);
    this.saveProfile();
  }

  toggleReminder(index: number) {
    this.reminders[index].active = !this.reminders[index].active;
    this.saveProfile();
  }

  // Delete account method
  deleteAccount() {
    Swal.fire({
      title: 'Are you absolute sure?',
      text: 'This will delete your user profile and cancel all med alarms. This action is irreversible!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete my profile!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.deleteProfile().subscribe({
          next: (res) => {
            if (res.success) {
              Swal.fire({
                title: 'Account Deleted',
                text: 'Your registration was successfully removed.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.router.navigate(['/']);
            }
          },
          error: (err) => {
            Swal.fire({
              title: 'Deletion Failed',
              text: err.error?.message || 'Error occurred while deleting account.',
              icon: 'error',
              confirmButtonColor: '#10b981'
            });
          }
        });
      }
    });
  }
}
