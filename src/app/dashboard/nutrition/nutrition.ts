import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, map, tap } from 'rxjs';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-nutrition',
  imports: [DecimalPipe, TitleCasePipe],
  templateUrl: './nutrition.html',
  styleUrl: './nutrition.css',
})
export class Nutrition {
  private http = inject(HttpClient);
  
  private searchSubject = new Subject<string>();
  
  isLoading = signal(false);
  error = signal<string | null>(null);
  foods = signal<any[]>([]);
  hasSearched = signal(false);
  
  // Track recently logged food for UI feedback
  recentlyLogged = signal<string | null>(null);
  
  constructor() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(query => {
        if (query.trim()) {
          this.isLoading.set(true);
          this.error.set(null);
          this.hasSearched.set(true);
        }
      }),
      switchMap(query => {
        if (!query.trim()) {
          return of([]);
        }
        return this.http.get<any>(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${environment.usdaApiKey}`)
          .pipe(
            map(res => res.foods || []),
            catchError(err => {
              this.error.set('Failed to fetch data from USDA API. Please try again.');
              return of([]);
            })
          );
      })
    ).subscribe(results => {
      this.foods.set(results);
      this.isLoading.set(false);
    });
  }

  onSearchChange(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    if (!query.trim()) {
      this.foods.set([]);
      this.isLoading.set(false);
      this.error.set(null);
      this.hasSearched.set(false);
      return;
    }
    this.searchSubject.next(query);
  }

  getMacro(food: any, nutrientId: number): number {
    const nutrient = food.foodNutrients?.find((n: any) => n.nutrientId === nutrientId || n.nutrientNumber === nutrientId.toString());
    return nutrient ? nutrient.value : 0;
  }

  onFoodClick(food: any) {
    const protein = this.getMacro(food, 1003);
    const fat = this.getMacro(food, 1004);
    const carbs = this.getMacro(food, 1005);
    
    const loggedItem = {
      name: food.description,
      protein,
      fat,
      carbs
    };
    
    console.log('🍽️ Food Selected for MyPlate:', loggedItem);
    
    // Provide visual feedback
    this.recentlyLogged.set(food.fdcId);
    setTimeout(() => {
      if (this.recentlyLogged() === food.fdcId) {
        this.recentlyLogged.set(null);
      }
    }, 2000);
    
    // TODO: Save to local state/store to deduct from user's daily MyPlate limits
  }
}
