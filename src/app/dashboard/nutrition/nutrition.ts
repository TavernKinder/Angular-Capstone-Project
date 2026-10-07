import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, map, tap } from 'rxjs';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { FoodCarousel } from '../../shared/components/food-carousel/food-carousel';
import { AuthService } from '../../shared/services/auth/auth';
import { ErrorModalService } from '../../shared/services/error-modal/error-modal';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { CustomFood, LoggableFood } from '../../shared/utils/food-log';
import { AddFoodModal } from './add-food-modal/add-food-modal';
import { CustomFoodDraft, CustomFoodModal } from './custom-food-modal/custom-food-modal';


@Component({
  selector: 'app-nutrition',
  imports: [DecimalPipe, TitleCasePipe, FoodCarousel, AddFoodModal, CustomFoodModal, ConfirmDialog],
  templateUrl: './nutrition.html',
  styleUrl: './nutrition.css',
})
export class Nutrition {
  private http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);
  private readonly errorModal = inject(ErrorModalService);
  
  private searchSubject = new Subject<string>();
  
  isLoading = signal(false);
  error = signal<string | null>(null);
  foods = signal<any[]>([]);
  hasSearched = signal(false);
  
  // Track recently logged food for UI feedback
  recentlyLogged = signal<string | number | null>(null);

  readonly searchQuery = signal('');
  readonly customFoods = signal<CustomFood[]>([]);
  readonly addingFood = signal<LoggableFood | null>(null);
  /** 'new' while creating, the food while editing, null when closed. */
  readonly customModal = signal<CustomFood | 'new' | null>(null);
  readonly deletingCustomFood = signal<CustomFood | null>(null);
  readonly isSavingCustomFood = signal(false);

  readonly editingCustomFood = computed(() => {
    const modal = this.customModal();
    return modal === 'new' ? null : modal;
  });

  /** Custom foods matching the search box; all of them when it is empty. */
  readonly visibleCustomFoods = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.customFoods();
    return this.customFoods().filter((food) =>
      `${food.name} ${food.brand ?? ''}`.toLowerCase().includes(query),
    );
  });
  
  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.customFoods.set([]);
        return;
      }
      void this.loadCustomFoods(user);
    });

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
    this.searchQuery.set(query);
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
    this.addingFood.set({
      fdcId: food.fdcId,
      name: food.description,
      brand: food.brandOwner || undefined,
      calories: this.getMacro(food, 1008),
      protein: this.getMacro(food, 1003),
      carbs: this.getMacro(food, 1005),
      fat: this.getMacro(food, 1004),
    });
  }

  onCustomFoodClick(food: CustomFood) {
    const { id, ...macros } = food;
    this.addingFood.set({ ...macros, customFoodId: id });
  }

  onFoodLogged() {
    const food = this.addingFood();
    this.addingFood.set(null);

    const key = food?.customFoodId ?? food?.fdcId ?? null;
    this.recentlyLogged.set(key);
    setTimeout(() => {
      if (this.recentlyLogged() === key) this.recentlyLogged.set(null);
    }, 2000);
  }

  async saveCustomFood(result: { draft: CustomFoodDraft; logAfter: boolean }) {
    const user = this.authService.currentUser();
    if (!user || this.isSavingCustomFood()) return;

    const editing = this.customModal();
    this.isSavingCustomFood.set(true);
    try {
      if (editing && editing !== 'new') {
        const updated: CustomFood = { ...result.draft, id: editing.id };
        await this.firestoreWriteService.updateCustomFood(user, updated);
        this.customFoods.update((foods) => foods.map((food) => (food.id === updated.id ? updated : food)));
        this.customModal.set(null);
      } else {
        const created = await this.firestoreWriteService.createCustomFood(user, result.draft);
        this.customFoods.update((foods) => [...foods, created]);
        this.customModal.set(null);
        if (result.logAfter) this.onCustomFoodClick(created);
      }
    } catch (err) {
      console.error('Failed to save custom food:', err);
      this.errorModal.showError('Unable to save that custom food. Please try again.');
    } finally {
      this.isSavingCustomFood.set(false);
    }
  }

  async deleteCustomFood() {
    const user = this.authService.currentUser();
    const food = this.deletingCustomFood();
    if (!user || !food || this.isSavingCustomFood()) return;

    this.isSavingCustomFood.set(true);
    try {
      await this.firestoreWriteService.deleteCustomFood(user, food.id);
      this.customFoods.update((foods) => foods.filter((item) => item.id !== food.id));
      this.deletingCustomFood.set(null);
    } catch (err) {
      console.error('Failed to delete custom food:', err);
      this.errorModal.showError('Unable to delete that custom food. Please try again.');
    } finally {
      this.isSavingCustomFood.set(false);
    }
  }

  private async loadCustomFoods(user: NonNullable<ReturnType<AuthService['currentUser']>>) {
    try {
      this.customFoods.set(await this.firestoreWriteService.getCustomFoods(user));
    } catch (err) {
      console.error('Failed to load custom foods:', err);
      this.errorModal.showError('Unable to load your custom foods.');
    }
  }
}