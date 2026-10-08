import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth';
import { ErrorModalService } from '../error-modal/error-modal';
import { FirestoreWriteService } from '../firestore/firestore-write';
import {
  FoodLogEntry,
  LoggableFood,
  sortDateKeys,
  stripUndefined,
  toDateKey,
} from '../../utils/food-log';

/** How many logged days to keep loaded on each side of the selected day. */
const WINDOW = 3;

@Injectable({
  providedIn: 'root',
})
export class FoodLogService {
  private readonly authService = inject(AuthService);
  private readonly firestoreWriteService = inject(FirestoreWriteService);
  private readonly errorModal = inject(ErrorModalService);

  /** Logged days (dd-mm-yyyy), oldest first. */
  readonly dateKeys = signal<string[]>([]);
  readonly selectedKey = signal<string | null>(null);
  readonly days = signal<Record<string, FoodLogEntry[]>>({});
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private loadedUid: string | null = null;

  readonly selectedIndex = computed(() => {
    const key = this.selectedKey();
    return key === null ? -1 : this.dateKeys().indexOf(key);
  });
  readonly selectedEntries = computed(() => this.days()[this.selectedKey() ?? ''] ?? []);
  readonly hasPrevious = computed(() => this.selectedIndex() > 0);
  readonly hasNext = computed(() => {
    const index = this.selectedIndex();
    return index >= 0 && index < this.dateKeys().length - 1;
  });
  readonly isEmpty = computed(() => this.dateKeys().length === 0);

  /** Loads the list of logged days once per signed-in user, opening on today or the latest day. */
  async load(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      this.reset();
      return;
    }
    if (this.loadedUid === user.uid) return;

    this.loadedUid = user.uid;
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const keys = sortDateKeys(await this.firestoreWriteService.getFoodLogDates(user));
      if (this.loadedUid !== user.uid) return;
      this.dateKeys.set(keys);
      const today = toDateKey(new Date());
      await this.select(keys.includes(today) ? today : (keys[keys.length - 1] ?? null));
    } catch (err) {
      console.error('Failed to load food log:', err);
      this.loadedUid = null;
      this.error.set('Unable to load your food log.');
    } finally {
      this.isLoading.set(false);
    }
  }

  previous(): Promise<void> {
    return this.step(-1);
  }

  next(): Promise<void> {
    return this.step(1);
  }

  async log(food: LoggableFood, dateKey: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('You need to be signed in to log food.');

    const entry: FoodLogEntry = stripUndefined({
      ...food,
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
    });
    await this.firestoreWriteService.addFoodEntry(user, dateKey, entry);

    if (this.loadedUid !== user.uid) return;
    this.days.update((days) => ({ ...days, [dateKey]: [...(days[dateKey] ?? []), entry] }));
    this.dateKeys.update((keys) => (keys.includes(dateKey) ? keys : sortDateKeys([...keys, dateKey])));
    await this.select(dateKey);
  }

  async remove(entry: FoodLogEntry): Promise<void> {
    const user = this.authService.currentUser();
    const dateKey = this.selectedKey();
    if (!user || !dateKey) return;

    try {
      await this.firestoreWriteService.removeFoodEntry(user, dateKey, entry.id);
    } catch (err) {
      console.error('Failed to remove food entry:', err);
      this.errorModal.showError('Unable to remove that food. Please try again.');
      return;
    }

    const remaining = (this.days()[dateKey] ?? []).filter((item) => item.id !== entry.id);
    if (remaining.length > 0) {
      this.days.update((days) => ({ ...days, [dateKey]: remaining }));
      return;
    }

    // The day is now empty: drop it and move to the nearest remaining day.
    const keys = this.dateKeys();
    const index = keys.indexOf(dateKey);
    const nextKeys = keys.filter((key) => key !== dateKey);
    this.days.update(({ [dateKey]: _removed, ...days }) => days);
    this.dateKeys.set(nextKeys);
    await this.select(nextKeys[Math.min(index, nextKeys.length - 1)] ?? null);
  }

  private async step(direction: -1 | 1): Promise<void> {
    const key = this.dateKeys()[this.selectedIndex() + direction];
    if (key) await this.select(key);
  }

  private async select(key: string | null): Promise<void> {
    this.selectedKey.set(key);
    if (key) await this.loadWindow(key);
  }

  /** Loads the selected day plus up to 3 logged days on each side, skipping ones already loaded. */
  private async loadWindow(key: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    const keys = this.dateKeys();
    const index = keys.indexOf(key);
    const missing = keys
      .slice(Math.max(0, index - WINDOW), index + WINDOW + 1)
      .filter((windowKey) => !(windowKey in this.days()));
    if (missing.length === 0) return;

    this.isLoading.set(true);
    try {
      const loaded = await Promise.all(
        missing.map(async (dateKey) => [dateKey, await this.firestoreWriteService.getFoodLogDay(user, dateKey)] as const),
      );
      if (this.loadedUid !== user.uid) return;
      this.days.update((days) => ({ ...days, ...Object.fromEntries(loaded) }));
    } catch (err) {
      console.error('Failed to load food log days:', err);
      this.error.set('Unable to load your food log.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private reset(): void {
    this.loadedUid = null;
    this.dateKeys.set([]);
    this.selectedKey.set(null);
    this.days.set({});
    this.error.set(null);
  }
}
