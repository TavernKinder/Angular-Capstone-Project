export interface Macros {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/** A food snapshot saved to a day's log. Macros are per 100g. */
export interface FoodLogEntry extends Macros {
  id: string;
  fdcId?: number;
  customFoodId?: string;
  name: string;
  brand?: string;
  loggedAt: string;
}

/** A user-created food. Macros are per 100g and all optional. */
export interface CustomFood extends Macros {
  id: string;
  name: string;
  brand?: string;
}

/** What the add-to-day modal needs to log a food from either source. */
export type LoggableFood = Omit<FoodLogEntry, 'id' | 'loggedAt'>;

export const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat'] as const;

/** Local date as dd-mm-yyyy, the Firestore document id for a day. */
export function toDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

export function fromDateKey(key: string): Date {
  const [day, month, year] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Sorts dd-mm-yyyy keys oldest first. */
export function sortDateKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => fromDateKey(a).getTime() - fromDateKey(b).getTime());
}

/** yyyy-mm-dd, the format `<input type="date">` uses. */
export function toInputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function inputDateToKey(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return toDateKey(new Date(year, month - 1, day));
}

/** Removes undefined values, which Firestore rejects. */
export function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/** Sums the macros present on each entry; missing values count as 0. */
export function sumMacros(entries: Macros[]): Required<Macros> {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const entry of entries) {
    for (const key of MACRO_KEYS) totals[key] += entry[key] ?? 0;
  }
  return totals;
}
