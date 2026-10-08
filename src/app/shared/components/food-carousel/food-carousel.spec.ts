import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../services/auth/auth';
import { FirestoreWriteService } from '../../services/firestore/firestore-write';
import { FoodCarousel } from './food-carousel';

describe('FoodCarousel', () => {
  const currentUser = signal<{ uid: string } | null>({ uid: 'user-1' });
  const entry = (id: string, name: string) => ({ id, name, calories: 100, protein: 10, loggedAt: '' });
  const getFoodLogDates = vi.fn();
  const getFoodLogDay = vi.fn();
  const removeFoodEntry = vi.fn();

  async function render(): Promise<{ fixture: ComponentFixture<FoodCarousel>; el: HTMLElement }> {
    TestBed.configureTestingModule({
      imports: [FoodCarousel],
      providers: [
        { provide: AuthService, useValue: { currentUser } },
        { provide: FirestoreWriteService, useValue: { getFoodLogDates, getFoodLogDay, removeFoodEntry } },
      ],
    });
    const fixture = TestBed.createComponent(FoodCarousel);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const buttons = (el: HTMLElement) => ({
    prev: el.querySelector<HTMLButtonElement>('[aria-label="Previous logged day"]')!,
    next: el.querySelector<HTMLButtonElement>('[aria-label="Next logged day"]')!,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set({ uid: 'user-1' });
    getFoodLogDay.mockImplementation(async (_user: unknown, key: string) => [entry(key, `Food ${key}`)]);
    removeFoodEntry.mockResolvedValue(undefined);
  });

  it('shows the Start Logging screen when nothing is logged', async () => {
    getFoodLogDates.mockResolvedValue([]);
    const { el } = await render();
    expect(el.textContent).toContain('Start Logging');
  });

  it('opens on the latest logged day and skips empty days when navigating', async () => {
    getFoodLogDates.mockResolvedValue(['06-01-2020', '03-01-2020', '04-01-2020']);
    const { fixture, el } = await render();

    expect(el.textContent).toContain('Food 06-01-2020');
    expect(buttons(el).next.disabled).toBe(true);

    buttons(el).prev.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('Food 04-01-2020');
    expect(el.textContent).not.toContain('05-01-2020');

    buttons(el).prev.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('Food 03-01-2020');
    expect(buttons(el).prev.disabled).toBe(true);
  });

  it('only loads the 3 days on each side of the selected day', async () => {
    const keys = Array.from({ length: 8 }, (_, i) => `0${i + 1}-01-2020`);
    getFoodLogDates.mockResolvedValue(keys);
    await render();
    expect(getFoodLogDay).toHaveBeenCalledTimes(4);
  });

  it('removes an entry after confirmation and falls back to the previous day', async () => {
    getFoodLogDates.mockResolvedValue(['03-01-2020', '04-01-2020']);
    const { fixture, el } = await render();

    el.querySelector<HTMLButtonElement>('[aria-label="Remove Food 04-01-2020"]')!.click();
    fixture.detectChanges();
    Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Remove')!
      .click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(removeFoodEntry).toHaveBeenCalledWith({ uid: 'user-1' }, '04-01-2020', '04-01-2020');
    expect(el.textContent).toContain('Food 03-01-2020');
    expect(buttons(el).next.disabled).toBe(true);
  });
});
