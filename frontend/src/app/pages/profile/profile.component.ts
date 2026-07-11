import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
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

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const user = res.data;
          this.name = user.name || '';
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

  saveProfile() {
    this.isSaving.set(true);

    const allergiesArray = this.allergiesText
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const profilePayload = {
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

    this.authService.updateProfile(profilePayload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
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
      error: () => {
        this.isSaving.set(false);
        Swal.fire({
          title: 'Update Failed',
          text: 'Unable to update profile settings.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
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
        confirmButtonColor: '#0d9488'
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
}
