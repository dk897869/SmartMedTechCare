import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
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
    { 
      sender: 'bot', 
      text: 'Hello! I am your SmartMed AI Agent. How can I help you today? I have full access to our website tools. Try asking me: "Navigate to compare medicines", "Add Crocin to my cart", "Clear my cart", "State your site guidelines", or type in your symptoms!' 
    }
  ];

  constructor(
    public readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly router: Router
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

  isListeningVoice = false;
  private recognition: any = null;

  toggleVoiceInput() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire({
        title: 'Not Supported',
        text: 'Speech recognition is not supported in this browser. Please try Chrome.',
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (this.isListeningVoice) {
      if (this.recognition) {
        this.recognition.stop();
      }
      this.isListeningVoice = false;
      return;
    }

    this.isListeningVoice = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const voiceText = event.results[0][0].transcript;
      this.chatInput = voiceText;
      this.isListeningVoice = false;
      
      // Auto-send voice queries
      setTimeout(() => {
        this.sendChatMessage();
      }, 500);
    };

    this.recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      this.isListeningVoice = false;
    };

    this.recognition.onend = () => {
      this.isListeningVoice = false;
    };

    this.recognition.start();
  }

  private executeAgentAction(agentData: any) {
    if (!agentData || !agentData.action) return;

    const action = agentData.action;

    // 1. Action: navigate
    if (action === 'navigate' && agentData.page) {
      const path = agentData.page.startsWith('/') ? agentData.page : `/${agentData.page}`;
      setTimeout(() => {
        this.router.navigate([path]);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: `AI Agent: Redirected to ${path}`,
          showConfirmButton: false,
          timer: 2500
        });
      }, 800);
    }

    // 2. Action: clear_cart
    else if (action === 'clear_cart') {
      this.cartService.clearCart();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'AI Agent: Cleared your cart successfully!',
        showConfirmButton: false,
        timer: 2500
      });
    }

    // 3. Action: logout
    else if (action === 'logout') {
      this.authService.logout();
      setTimeout(() => {
        this.router.navigate(['/login']);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'AI Agent: Logged you out successfully!',
          showConfirmButton: false,
          timer: 2500
        });
      }, 800);
    }

    // 4. Action: show_training
    else if (action === 'show_training') {
      setTimeout(() => {
        Swal.fire({
          title: 'SmartMed Agent Training Guide',
          html: `
            <div class="text-start" style="font-size: 0.9rem; line-height: 1.5;">
              <p>Welcome to <strong>SmartMedTechCare</strong>! As your interactive AI Agent, here is how you can use this platform:</p>
              <ul>
                <li><strong>Symptom Checker</strong>: Tell me how you feel, or navigate to Symptom Checker to run structured medical evaluations.</li>
                <li><strong>Price Comparison</strong>: Search for items like <em>Crocin</em> or <em>Dolo</em>, and click "Compare" to see prices across regional stores (Apollo, MedPlus, Wellness Forever).</li>
                <li><strong>Proximity Mapping</strong>: Locate stores near you, check ratings, and call them directly.</li>
                <li><strong>Shopping Cart</strong>: Accumulate products from multiple stores, split billing automatically at checkout, and trace live deliveries!</li>
              </ul>
              <p class="small text-muted mt-2">💡 Try telling me: <em>"Clear my cart"</em>, <em>"Navigate to medicines page"</em>, or <em>"I have a fever"</em>!</p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Got it, thanks!',
          confirmButtonColor: '#10b981'
        });
      }, 500);
    }

    // 5. Action: add_to_cart
    else if (action === 'add_to_cart' && agentData.medicine) {
      const medName = agentData.medicine;
      const quantity = agentData.quantity ? parseInt(agentData.quantity) : 1;
      
      this.apiService.get<any>(`medicines`).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const med = res.data.find((m: any) => m.name.toLowerCase().includes(medName.toLowerCase()));
            if (med) {
              this.apiService.get<any>(`medicines/${med._id}/compare`).subscribe({
                next: (compareRes) => {
                  if (compareRes.success && compareRes.data && compareRes.data.length > 0) {
                    const bestListing = compareRes.data[0];
                    
                    // Add quantity times
                    for (let i = 0; i < quantity; i++) {
                      this.cartService.addToCart(med, bestListing.price, bestListing.pharmacyId);
                    }
                    
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'success',
                      title: `AI Agent: Added ${quantity}x ${med.name} to cart!`,
                      showConfirmButton: false,
                      timer: 3000
                    });
                  }
                }
              });
            } else {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: `AI Agent: Could not find medicine "${medName}" in catalog.`,
                showConfirmButton: false,
                timer: 2500
              });
            }
          }
        }
      });
    }

    // 6. Action: remove_from_cart
    else if (action === 'remove_from_cart' && agentData.medicine) {
      const medName = agentData.medicine;
      const cartItems = this.cartService.items();
      const match = cartItems.find(item => item.name.toLowerCase().includes(medName.toLowerCase()));
      if (match) {
        this.cartService.removeFromCart(match.medicineId, match.pharmacyId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `AI Agent: Removed ${match.name} from cart.`,
          showConfirmButton: false,
          timer: 2500
        });
      }
    }

    // 7. Action: update_cart
    else if (action === 'update_cart' && agentData.medicine) {
      const medName = agentData.medicine;
      const quantity = agentData.quantity ? parseInt(agentData.quantity) : 1;
      const cartItems = this.cartService.items();
      const match = cartItems.find(item => item.name.toLowerCase().includes(medName.toLowerCase()));
      if (match) {
        this.cartService.updateQuantity(match.medicineId, match.pharmacyId, quantity);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `AI Agent: Updated ${match.name} quantity to ${quantity}.`,
          showConfirmButton: false,
          timer: 2500
        });
      }
    }

    // 8. Action: checkout
    else if (action === 'checkout') {
      setTimeout(() => {
        this.router.navigate(['/checkout']);
      }, 500);
    }

    // 9. Action: track_order
    else if (action === 'track_order') {
      setTimeout(() => {
        this.router.navigate(['/orders']);
      }, 500);
    }

    // 10. Action: nearby_pharmacy
    else if (action === 'nearby_pharmacy') {
      setTimeout(() => {
        this.router.navigate(['/pharmacies']);
      }, 500);
    }

    // 11. Action: view_cart
    else if (action === 'view_cart') {
      setTimeout(() => {
        this.router.navigate(['/cart']);
      }, 500);
    }

    // 12. Action: symptom_analysis
    else if (action === 'symptom_analysis') {
      setTimeout(() => {
        this.router.navigate(['/symptoms']);
      }, 500);
    }
  }

  // Send message to AI Agent Chat engine
  sendChatMessage() {
    const queryText = this.chatInput.trim();
    if (!queryText) return;

    // Push user message
    this.chatMessages.push({ sender: 'user', text: queryText });
    this.chatInput = '';
    this.isChatLoading.set(true);

    this.apiService.post<any>('ai/chat', { 
      message: queryText, 
      history: this.chatMessages.slice(0, -1) 
    }).subscribe({
      next: (res) => {
        this.isChatLoading.set(false);
        const agentData = res.data || res.response;
        if (res.success && agentData) {
          // Execute parsed dynamic action payload
          this.executeAgentAction(agentData);
          
          this.chatMessages.push({ 
            sender: 'bot', 
            text: agentData.reply || 'I have completed your request!' 
          });
        }
      },
      error: () => {
        this.isChatLoading.set(false);
        this.chatMessages.push({
          sender: 'bot',
          text: '⚠️ I encountered an error connecting to the AI agent. Please make sure the server is online!'
        });
      }
    });
  }
}
