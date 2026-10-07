import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth';
import { FoodLogService } from '../../services/food-log/food-log';
import { FoodLogEntry, fromDateKey, sumMacros, toDateKey } from '../../utils/food-log';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-food-carousel',
  imports: [DecimalPipe, DatePipe, ConfirmDialog],
  templateUrl: './food-carousel.html',
  styleUrl: './food-carousel.css',
})
export class FoodCarousel {
  private readonly authService = inject(AuthService);
  protected readonly foodLog = inject(FoodLogService);

  protected readonly removing = signal<FoodLogEntry | null>(null);
  protected readonly isRemoving = signal(false);

  protected readonly totals = computed(() => sumMacros(this.foodLog.selectedEntries()));
  protected readonly dayLabel = computed(() => {
    const key = this.foodLog.selectedKey();
    if (!key) return '';

    const today = new Date();
    if (key === toDateKey(today)) return 'Today';
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    return key === toDateKey(yesterday) ? 'Yesterday' : null;
  });
  protected readonly selectedDate = computed(() => {
    const key = this.foodLog.selectedKey();
    return key ? fromDateKey(key) : null;
  });
  protected readonly position = computed(
    () => `${this.foodLog.selectedIndex() + 1} of ${this.foodLog.dateKeys().length}`,
  );

  constructor() {
    effect(() => {
      this.authService.currentUser();
      void this.foodLog.load();
    });
  }

  protected async confirmRemove(): Promise<void> {
    const entry = this.removing();
    if (!entry || this.isRemoving()) return;

    this.isRemoving.set(true);
    try {
      await this.foodLog.remove(entry);
    } finally {
      this.isRemoving.set(false);
      this.removing.set(null);
    }
  }

  protected focusSearch(): void {
    document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  }
}
