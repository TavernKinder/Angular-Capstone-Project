import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workout as WorkoutService } from '../../shared/services/workout/workout';

@Component({
  selector: 'app-workout',
  imports: [CommonModule],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout implements OnInit {
  public workoutService = inject(WorkoutService);

  public searchQuery = signal<string>('');
  
  public filteredExercises = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const exercises = this.workoutService.exercises();
    if (!query) return exercises;
    return exercises.filter(ex => ex.name.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    this.workoutService.loadExercises();
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}

