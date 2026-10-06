import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workout as WorkoutService, Exercise } from '../../shared/services/workout/workout';
import { RoutineService, SavedRoutineItem } from '../../shared/services/routine/routine';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';

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
  public authService = inject(AuthService);
  public firestoreWriteService = inject(FirestoreWriteService);

  public searchQuery = signal<string>('');

  // Modal State
  public isModalOpen = signal<boolean>(false);
  public selectedExercise = signal<Exercise | null>(null);
  public minutesInput = 30;
  public repsInput = 12;
  public dayInput = 'Monday';

  // Custom Workout Modal State
  public isCustomModalOpen = signal<boolean>(false);
  public customName = '';
  public customDesc = '';
  public customDetails = '';
  public customWorkouts = signal<any[]>([]);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.firestoreWriteService.getCustomWorkouts(user).then(workouts => {
          this.customWorkouts.set(workouts);
        }).catch(err => console.error('Failed to load custom workouts', err));
      } else {
        this.customWorkouts.set([]);
      }
    });
  }

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
    if (!query) return exercises.slice(0, 5);
    return exercises.filter((ex) => ex.name.toLowerCase().includes(query)).slice(0, 5);
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

  openCustomModal() {
    this.customName = '';
    this.customDesc = '';
    this.customDetails = '';
    this.isCustomModalOpen.set(true);
  }

  closeCustomModal() {
    this.isCustomModalOpen.set(false);
  }

  async confirmAddCustomWorkout() {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastMessage.set('You must be logged in to create a custom workout.');
      setTimeout(() => this.toastMessage.set(null), 4000);
      return;
    }

    if (!this.customName.trim()) {
      return;
    }

    try {
      const newWorkout = await this.firestoreWriteService.createCustomWorkout(user, {
        name: this.customName,
        description: this.customDesc,
        details: this.customDetails
      });

      this.customWorkouts.update(workouts => [...workouts, newWorkout]);
      this.closeCustomModal();
      this.toastMessage.set(`Custom workout "${this.customName}" saved!`);
      setTimeout(() => this.toastMessage.set(null), 4000);
    } catch (err) {
      this.toastMessage.set('Failed to save custom workout.');
      setTimeout(() => this.toastMessage.set(null), 4000);
    }
  }
}
