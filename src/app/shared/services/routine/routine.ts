import { Injectable, inject, signal } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';

export interface SavedRoutineItem {
  id?: string;
  userId?: string;
  exerciseId?: number;
  exerciseName: string;
  minutes: number;
  reps: number;
  dayOfWeek?: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class RoutineService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly user$ = user(this.auth);

  readonly routines = signal<SavedRoutineItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.user$.subscribe((currentUser) => {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
      if (currentUser) {
        this.initListener(currentUser.uid);
      } else {
        this.routines.set([]);
      }
    });
  }

  private initListener(userId: string) {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const routinesRef = collection(this.firestore, 'userInfo', userId, 'routines');
      const q = query(routinesRef, orderBy('createdAt', 'desc'));
      this.unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: SavedRoutineItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<SavedRoutineItem, 'id'>),
          }));
          this.routines.set(items);
          this.isLoading.set(false);
        },
        (err) => {
          console.warn('Firestore snapshot error:', err);
          this.error.set('Unable to load your saved workouts. Please try again.');
          this.isLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('Failed to listen to routines:', e);
      this.error.set('Unable to load your saved workouts. Please try again.');
      this.isLoading.set(false);
    }
  }

  async addRoutine(item: Omit<SavedRoutineItem, 'id' | 'userId'>): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      try {
        const routinesRef = collection(this.firestore, 'userInfo', currentUser.uid, 'routines');
        await addDoc(routinesRef, {
          ...item,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        return;
      } catch (err) {
        console.warn('Firestore write failed, saving to local state:', err);
        this.error.set(
          'Could not save this workout to your account. It will only remain until you leave this page.',
        );
      }
    }

    // Fallback in-memory state
    const newItem: SavedRoutineItem = {
      id: 'local-' + Date.now(),
      ...item,
    };
    this.routines.update((prev) => [newItem, ...prev]);
  }

  async deleteRoutine(id: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser && !id.startsWith('local-')) {
      try {
        const docRef = doc(this.firestore, 'userInfo', currentUser.uid, 'routines', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firestore delete error:', err);
        this.error.set('Unable to delete this saved workout. Please try again.');
      }
    }
    this.routines.update((prev) => prev.filter((r) => r.id !== id));
  }
}
