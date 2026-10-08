import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RoutineService } from '../../services/routine/routine';
import { WeeklySchedule } from './weekly-schedule';

describe('WeeklySchedule', () => {
  let component: WeeklySchedule;
  let fixture: ComponentFixture<WeeklySchedule>;
  const routines = signal([
    { id: 'routine-1', exerciseName: 'Run', minutes: 30, reps: 1, dayOfWeek: 'Monday' },
  ]);
  const deleteRoutine = vi.fn();

  beforeEach(async () => {
    routines.set([
      { id: 'routine-1', exerciseName: 'Run', minutes: 30, reps: 1, dayOfWeek: 'Monday' },
    ]);
    deleteRoutine.mockClear();
    await TestBed.configureTestingModule({
      imports: [WeeklySchedule],
      providers: [
        {
          provide: RoutineService,
          useValue: { routines, deleteRoutine },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklySchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('groups routines under their scheduled day', () => {
    expect(component.routinesByDay().find((group) => group.day === 'Monday')?.routines).toEqual([
      { id: 'routine-1', exerciseName: 'Run', minutes: 30, reps: 1, dayOfWeek: 'Monday' },
    ]);
  });

  it('deletes a saved routine by id', () => {
    component.deleteRoutine(routines()[0]);

    expect(deleteRoutine).toHaveBeenCalledWith('routine-1');
  });
});
