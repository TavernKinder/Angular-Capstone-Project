import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { Nutrition } from './nutrition';

describe('Nutrition', () => {
  let component: Nutrition;
  let fixture: ComponentFixture<Nutrition>;
  const user = { uid: 'user-1' };
  const firestoreWriteService = {
    getCustomFoods: vi.fn(),
    createCustomFood: vi.fn(),
    deleteCustomFood: vi.fn(),
    updateCustomFood: vi.fn(),
    getFoodLogDates: vi.fn().mockResolvedValue([]),
    getFoodLogDay: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    firestoreWriteService.getCustomFoods.mockResolvedValue([
      { id: 'a', name: 'Protein Shake', brand: 'Home' },
      { id: 'b', name: 'Oat Bar' },
    ]);
    firestoreWriteService.getFoodLogDates.mockResolvedValue([]);
    await TestBed.configureTestingModule({
      imports: [Nutrition],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: { currentUser: signal(user) } },
        { provide: FirestoreWriteService, useValue: firestoreWriteService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Nutrition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads custom foods and filters them by the search text', () => {
    expect(component.visibleCustomFoods().length).toBe(2);
    component.searchQuery.set('shake');
    expect(component.visibleCustomFoods().map((food) => food.id)).toEqual(['a']);
    component.searchQuery.set('home');
    expect(component.visibleCustomFoods().map((food) => food.id)).toEqual(['a']);
  });

  it('creates a custom food and offers to log it when requested', async () => {
    firestoreWriteService.createCustomFood.mockResolvedValue({ id: 'c', name: 'Soup' });
    component.customModal.set('new');
    await component.saveCustomFood({ draft: { name: 'Soup' }, logAfter: true });

    expect(firestoreWriteService.createCustomFood).toHaveBeenCalledWith(user, { name: 'Soup' });
    expect(component.customFoods().some((food) => food.id === 'c')).toBe(true);
    expect(component.customModal()).toBeNull();
    expect(component.addingFood()).toEqual({ name: 'Soup', customFoodId: 'c' });
  });

  it('deletes a custom food after confirmation', async () => {
    firestoreWriteService.deleteCustomFood.mockResolvedValue(undefined);
    component.deletingCustomFood.set(component.customFoods()[0]);
    await component.deleteCustomFood();

    expect(firestoreWriteService.deleteCustomFood).toHaveBeenCalledWith(user, 'a');
    expect(component.customFoods().map((food) => food.id)).toEqual(['b']);
  });
});
