import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workout as WorkoutService, Exercise } from '../../shared/services/workout/workout';
import { RoutineService, SavedRoutineItem } from '../../shared/services/routine/routine';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { WeeklySchedule } from '../../shared/components/weekly-schedule/weekly-schedule';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, FormsModule, WeeklySchedule],
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

  // BMI Calculator State
  public isBmiPopoverOpen = signal<boolean>(false);
  public heightInches = signal<number>(68); // Default 5'8"
  public weightLbs = signal<number>(150);

  public bmi = computed(() => {
    const h = this.heightInches();
    const w = this.weightLbs();
    if (h === 0) return 0;
    return (w / (h * h)) * 703;
  });

  public bmiCategory = computed(() => {
    const b = this.bmi();
    if (b < 18.5) return 'Underweight';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Overweight';
    return 'Obese';
  });

  public bmiColor = computed(() => {
    const b = this.bmi();
    if (b < 18.5) return 'text-blue-500 bg-blue-100';
    if (b < 25) return 'text-emerald-500 bg-emerald-100';
    if (b < 30) return 'text-amber-500 bg-amber-100';
    return 'text-red-500 bg-red-100';
  });

  public bmiPercentage = computed(() => {
    // Map BMI from 15 to 40 into 0% to 100% for the gauge needle
    const b = this.bmi();
    const min = 15;
    const max = 40;
    let pct = ((b - min) / (max - min)) * 100;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    return pct;
  });

  toggleBmiPopover() {
    this.isBmiPopoverOpen.update(v => !v);
  }

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

  async deleteCustomWorkout(workout: any) {
    const confirmDelete = window.confirm(`Are you sure you wish to delete ${workout.name}?`);
    if (!confirmDelete) return;

    const user = this.authService.currentUser();
    if (!user) return;

    try {
      await this.firestoreWriteService.deleteCustomWorkout(user, workout.id);
      this.customWorkouts.update(workouts => workouts.filter(w => w.id !== workout.id));
      this.toastMessage.set(`Deleted "${workout.name}".`);
      setTimeout(() => this.toastMessage.set(null), 4000);
    } catch (err) {
      this.toastMessage.set('Failed to delete custom workout.');
      setTimeout(() => this.toastMessage.set(null), 4000);
    }
  }
}
