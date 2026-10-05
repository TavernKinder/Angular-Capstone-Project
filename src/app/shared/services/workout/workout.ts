import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Exercise {
  id: number;
  name: string;
  description: string;
  category: number;
}

export interface WgerResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

@Injectable({
  providedIn: 'root'
})
export class Workout {
  private readonly http = inject(HttpClient);

  // State management with Signals
  readonly exercises = signal<Exercise[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async loadExercises(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    // Use exerciseinfo which includes translations (names and descriptions)
    const url = 'https://wger.de/api/v2/exerciseinfo/?language=2&limit=20';

    try {
      const data = await firstValueFrom(this.http.get<WgerResponse>(url));
      
      // Map the complex wger response and strictly filter for English translations
      const mappedExercises: Exercise[] = data.results
        .map(item => {
          // In wger, language 2 is English. Find the explicit English translation.
          const translation = item.translations?.find((t: any) => t.language === 2);
          
          if (!translation) return null;

          return {
            id: item.id,
            name: translation.name,
            description: translation.description,
            category: item.category?.id || item.category || 0
          };
        })
        .filter((item): item is Exercise => item !== null); // Remove the nulls

      this.exercises.set(mappedExercises);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
      this.error.set('Failed to load exercises. Please try again later.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
