import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../shared/components/dialog/dialog';
import { CustomFood, MACRO_KEYS } from '../../../shared/utils/food-log';

export type CustomFoodDraft = Omit<CustomFood, 'id'>;

@Component({
  selector: 'app-custom-food-modal',
  imports: [Dialog, ReactiveFormsModule],
  templateUrl: './custom-food-modal.html',
})
export class CustomFoodModal {
  private readonly fb = inject(FormBuilder);

  /** When set, the form edits this food instead of creating one. */
  readonly food = input<CustomFood | null>(null);
  readonly isSaving = input(false);

  readonly closed = output<void>();
  readonly saved = output<{ draft: CustomFoodDraft; logAfter: boolean }>();

  protected readonly macroFields = MACRO_KEYS;
  protected readonly submitted = signal(false);
  protected readonly isEditing = computed(() => this.food() !== null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    brand: [''],
    calories: [null as number | null, [Validators.min(0)]],
    protein: [null as number | null, [Validators.min(0)]],
    carbs: [null as number | null, [Validators.min(0)]],
    fat: [null as number | null, [Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      const food = this.food();
      if (!food) return;
      this.form.reset({
        name: food.name,
        brand: food.brand ?? '',
        calories: food.calories ?? null,
        protein: food.protein ?? null,
        carbs: food.carbs ?? null,
        fat: food.fat ?? null,
      });
    });
  }

  protected submit(logAfter: boolean): void {
    this.submitted.set(true);
    if (this.form.invalid || this.isSaving()) return;

    const value = this.form.getRawValue();
    const draft: CustomFoodDraft = { name: (value.name ?? '').trim() };
    const brand = (value.brand ?? '').trim();
    if (brand) draft.brand = brand;
    for (const key of MACRO_KEYS) {
      const macro = value[key];
      if (macro !== null && macro !== undefined) draft[key] = macro;
    }
    this.saved.emit({ draft, logAfter });
  }

  protected showError(control: 'name' | 'calories' | 'protein' | 'carbs' | 'fat'): boolean {
    const field = this.form.controls[control];
    return this.submitted() && field.invalid;
  }
}
