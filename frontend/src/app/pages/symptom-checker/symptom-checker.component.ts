import { Component, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiService, DiagnosisResponse } from '../../services/ai.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-symptom-checker',
  imports: [FormsModule],
  templateUrl: './symptom-checker.component.html',
  styleUrl: './symptom-checker.component.scss'
})
export class SymptomCheckerComponent implements OnDestroy {
  symptomsText = '';
  readonly isLoading = signal(false);
  readonly isRecording = signal(false);
  readonly diagnosisResult = signal<DiagnosisResponse['data'] | null>(null);
  
  private recognition: any = null;

  constructor(
    private readonly aiService: AiService,
    private readonly router: Router
  ) {}

  toggleSpeech() {
    if (this.isRecording()) {
      if (this.recognition) {
        this.recognition.stop();
      }
      return;
    }

    this.isRecording.set(true);

    this.recognition = this.aiService.initSpeechRecognition(
      (transcription) => {
        this.symptomsText = transcription;
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Voice captured successfully',
          showConfirmButton: false,
          timer: 2000
        });
      },
      () => {
        this.isRecording.set(false);
      },
      (error) => {
        this.isRecording.set(false);
        Swal.fire({
          title: 'Speech Error',
          text: error,
          icon: 'warning',
          confirmButtonColor: '#0d9488'
        });
      }
    );

    if (this.recognition) {
      this.recognition.start();
    }
  }

  submitDiagnosis() {
    if (!this.symptomsText.trim()) {
      Swal.fire({
        title: 'Empty Symptoms',
        text: 'Please type or speak your symptoms first.',
        icon: 'info',
        confirmButtonColor: '#0d9488'
      });
      return;
    }

    this.isLoading.set(true);
    this.diagnosisResult.set(null);

    this.aiService.diagnose(this.symptomsText).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.diagnosisResult.set(res.data);
          
          if (res.data.requiresEmergencyCare) {
            Swal.fire({
              title: 'Emergency Warning!',
              text: res.data.medicalAdvice || 'Please seek immediate medical attention.',
              icon: 'warning',
              confirmButtonText: 'I Understand',
              confirmButtonColor: '#ef4444'
            });
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({
          title: 'Diagnosis Failed',
          text: 'Failed to complete AI diagnosis. Please try again.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
      }
    });
  }

  comparePrice(medName: string) {
    // Strip brand brackets if any (e.g. "Paracetamol (Acetaminophen)" -> "Paracetamol")
    const cleanName = medName.split('(')[0].trim();
    this.router.navigate(['/medicines'], { queryParams: { query: cleanName } });
  }

  ngOnDestroy() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
