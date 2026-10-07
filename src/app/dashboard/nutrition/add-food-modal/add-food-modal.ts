import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { ErrorModalService } from '../../../shared/services/error-modal/error-modal';
import { FoodLogService } from '../../../shared/services/food-log/food-log';
import {
  LoggableFood,
  inputDateToKey,
  toDateKey,
  toInputDate,
} from '../../../shared/utils/food-log';

@Component({
  selector: 'app-add-food-modal',
  imports: [Dialog, FormsModule],
  templateUrl: './add-food-modal.html',
})
export class AddFoodModal {
  private readonly foodLog = inject(FoodLogService);
  private readonly errorModal = inject(ErrorModalService);

  readonly food = input.required<LoggableFood>();
  readonly closed = output<void>();
  readonly logged = output<void>();

  protected readonly today = toInputDate(new Date());
  protected readonly pastDate = signal(this.today);
  protected readonly isSaving = signal(false);

  protected addToToday(): Promise<void> {
    return this.save(toDateKey(new Date()));
  }

  protected addToPastDate(): Promise<void> {
    const value = this.pastDate();
    if (!value || value > this.today) return Promise.resolve();
    return this.save(inputDateToKey(value));
  }

  private async save(dateKey: string): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.foodLog.log(this.food(), dateKey);
      this.logged.emit();
    } catch (err) {
      console.error('Failed to log food:', err);
      this.errorModal.showError('Unable to log that food. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
