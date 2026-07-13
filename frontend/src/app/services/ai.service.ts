import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface DiagnosisResponse {
  success: boolean;
  data: {
    possibleConditions: Array<{
      name: string;
      confidence: number;
      reason: string;
    }>;
    severity: 'Low' | 'Medium' | 'High' | 'Emergency';
    requiresDoctor: boolean;
    requiresEmergencyCare: boolean;
    redFlags: string[];
    recommendedOTCMedicines: Array<{
      name: string;
      purpose: string;
      dosage: string;
      duration: string;
      warnings: string;
    }>;
    homeCare: string[];
    followUpQuestions: string[];
    medicalAdvice: string;
    disclaimer: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(private readonly api: ApiService) {}

  diagnose(symptoms: string): Observable<DiagnosisResponse> {
    return this.api.post<DiagnosisResponse>('ai/diagnose', { symptoms });
  }

  // Native Web Speech API integration
  initSpeechRecognition(
    onResult: (text: string) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ): any {
    if (typeof window === 'undefined') {
      onError('Speech recognition not available in SSR mode.');
      return null;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError(event.error);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  }
}
