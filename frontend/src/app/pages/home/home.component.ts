import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  // Contact form inputs
  contactName = '';
  contactEmail = '';
  contactPhone = '';
  contactMessage = '';
  readonly isSubmittingQuery = signal(false);

  // Chatbot widget status
  isChatOpen = false;
  chatInput = '';
  readonly isChatLoading = signal(false);
  chatMessages: ChatMessage[] = [
    { sender: 'bot', text: 'Hi! I am your SmartMed Assistant. What may I help you with today? Tell me your symptoms, and I can analyze them!' }
  ];

  constructor(
    public readonly authService: AuthService,
    private readonly apiService: ApiService
  ) {
    // Autofill name and email if logged in
    const user = this.authService.currentUser();
    if (user) {
      this.contactName = user.name || '';
      this.contactEmail = user.email || '';
      this.contactPhone = user.phone || '';
    }
  }

  // Submit Contact query to database
  submitContactQuery() {
    if (!this.contactName.trim() || !this.contactEmail.trim() || !this.contactMessage.trim()) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all required fields (Name, Email, and Message).',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    this.isSubmittingQuery.set(true);

    const payload = {
      name: this.contactName.trim(),
      email: this.contactEmail.trim(),
      phone: this.contactPhone.trim(),
      message: this.contactMessage.trim()
    };

    this.apiService.post<any>('contacts', payload).subscribe({
      next: (res) => {
        this.isSubmittingQuery.set(false);
        if (res.success) {
          Swal.fire({
            title: 'Submitted!',
            text: 'Your query has been logged. Our medical assistant will contact you soon.',
            icon: 'success',
            confirmButtonColor: '#10b981'
          });
          // Clear query input only
          this.contactMessage = '';
        }
      },
      error: (err) => {
        this.isSubmittingQuery.set(false);
        Swal.fire({
          title: 'Submission Failed',
          text: err.error?.message || 'Could not save query. Make sure backend server is active.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  // Toggle chatbot console
  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  // Send message to AI engine
  sendChatMessage() {
    const queryText = this.chatInput.trim();
    if (!queryText) return;

    // Push user message
    this.chatMessages.push({ sender: 'user', text: queryText });
    this.chatInput = '';
    this.isChatLoading.set(true);

    this.apiService.post<any>('ai/diagnose', { symptoms: queryText }).subscribe({
      next: (res) => {
        this.isChatLoading.set(false);
        if (res.success && res.data) {
          const analysis = res.data.analysis;
          const remedies = res.data.recommendedMedicines?.map((m: any) => m.name).join(', ') || '';
          
          let botResponse = `📝 **Diagnosis Summary**: ${analysis.summary}\n`;
          botResponse += `⚠️ **Risk Level**: ${analysis.severity.toUpperCase()}\n`;
          if (remedies) {
            botResponse += `💊 **Recommended OTC Remedies**: ${remedies}\n`;
          }
          if (analysis.dangerSigns?.length > 0) {
            botResponse += `🚨 **Warning Signs**: ${analysis.dangerSigns.join(', ')}`;
          }

          this.chatMessages.push({ sender: 'bot', text: botResponse });
        }
      },
      error: () => {
        this.isChatLoading.set(false);
        this.chatMessages.push({
          sender: 'bot',
          text: '⚠️ I encountered an error connecting to the diagnostic server. Please try stating simple symptoms like "fever" or "cough".'
        });
      }
    });
  }
}
