import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workout as WorkoutService, Exercise } from '../../shared/services/workout/workout';
import { RoutineService, SavedRoutineItem } from '../../shared/services/routine/routine';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout implements OnInit {
  public workoutService = inject(WorkoutService);
  public routineService = inject(RoutineService);

  public searchQuery = signal<string>('');

  // Modal State
  public isModalOpen = signal<boolean>(false);
  public selectedExercise = signal<Exercise | null>(null);
  public minutesInput = 30;
  public repsInput = 12;
  public dayInput = 'Monday';

  // Feedback Toast
  public toastMessage = signal<string | null>(null);

  public readonly daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  public filteredExercises = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const exercises = this.workoutService.exercises();
    if (!query) return exercises;
    return exercises.filter((ex) => ex.name.toLowerCase().includes(query));
  });

  // Group saved routines by day of the week (Monday - Sunday)
  public routinesByDay = computed(() => {
    const list = this.routineService.routines();
    return this.daysOfWeek.map((day) => ({
      day,
      routines: list.filter((item) => (item.dayOfWeek || 'Monday') === day),
    }));
  });

  ngOnInit(): void {
    this.workoutService.loadExercises();
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openAddModal(exercise: Exercise) {
    this.selectedExercise.set(exercise);
    this.minutesInput = 30;
    this.repsInput = 12;
    this.dayInput = 'Monday';
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedExercise.set(null);
  }

  async confirmAddRoutine() {
    const ex = this.selectedExercise();
    if (!ex) return;

    const mins = Number(this.minutesInput) || 1;
    const reps = Number(this.repsInput) || 1;

    await this.routineService.addRoutine({
      exerciseId: ex.id,
      exerciseName: ex.name || 'Unnamed Exercise',
      minutes: mins,
      reps: reps,
      dayOfWeek: this.dayInput,
    });

    this.closeModal();

    // Trigger toast notification
    this.toastMessage.set(`Added "${ex.name}" to ${this.dayInput} (${mins} mins, ${reps} reps)!`);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  deleteRoutine(item: SavedRoutineItem) {
    if (item.id) {
      this.routineService.deleteRoutine(item.id);
    }
  }
}
