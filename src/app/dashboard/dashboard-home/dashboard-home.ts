import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Forcast } from '../forcast/forcast';
import { RoutineService } from '../../shared/services/routine/routine';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Forcast],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {
  public routineService = inject(RoutineService);

  // Compute today's day name (Monday, Tuesday, etc.)
  public readonly todayName = computed(() => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[new Date().getDay()];
  });

  // Filter routines to show only those scheduled for today
  public readonly todaysWorkouts = computed(() => {
    const today = this.todayName();
    return this.routineService.routines().filter((r) => (r.dayOfWeek || 'Monday') === today);
  });
}
