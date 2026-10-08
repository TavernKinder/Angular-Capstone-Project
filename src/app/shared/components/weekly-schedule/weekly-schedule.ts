import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutineService, SavedRoutineItem } from '../../services/routine/routine';

@Component({
  selector: 'app-weekly-schedule',
  imports: [CommonModule],
  templateUrl: './weekly-schedule.html',
  styleUrl: './weekly-schedule.css',
})
export class WeeklySchedule {
  public routineService = inject(RoutineService);

  public readonly daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  public routinesByDay = computed(() => {
    const list = this.routineService.routines();
    return this.daysOfWeek.map((day) => ({
      day,
      routines: list.filter((item) => (item.dayOfWeek || 'Monday') === day),
    }));
  });

  deleteRoutine(item: SavedRoutineItem) {
    if (item.id) {
      this.routineService.deleteRoutine(item.id);
    }
  }
}
