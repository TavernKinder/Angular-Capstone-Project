import { Injectable, inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { CustomFood, FoodLogEntry, stripUndefined } from '../../utils/food-log';

export type ThemePreference = 'light' | 'dark';

export interface DefaultLocationPreference {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  theme?: ThemePreference;
  reminders?: string;
  defaultLocation?: DefaultLocationPreference;
}

// The document ID is the user's uid; it is not stored as a field.
export interface UserProfile {
  userName?: string;
  preferences?: UserPreferences;
}

@Injectable({
  providedIn: 'root',
})
export class FirestoreWriteService {
  private readonly auth = inject(Auth);

  private async firestoreApi() {
    const api = await import('firebase/firestore');
    return { api, firestore: api.getFirestore() };
  }

  async createUserProfile(user: User): Promise<void> {
    this.assertSignedIn(user);

    const { api, firestore } = await this.firestoreApi();
    const profileRef = api.doc(firestore, 'userInfo', user.uid);
    const existingProfile = await api.getDoc(profileRef);
    if (existingProfile.exists()) return;

    await api.setDoc(profileRef, {
      userName: user.displayName ?? user.email?.split('@')[0] ?? '',
      preferences: { theme: 'light' },
    });
  }

  async getUserProfile(user: User): Promise<UserProfile | null> {
    this.assertSignedIn(user);

    const { api, firestore } = await this.firestoreApi();
    const snapshot = await api.getDoc(api.doc(firestore, 'userInfo', user.uid));
    return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
  }

  async updateTheme(user: User, theme: ThemePreference): Promise<void> {
    this.assertSignedIn(user);

    const { api, firestore } = await this.firestoreApi();
    await api.setDoc(
      api.doc(firestore, 'userInfo', user.uid),
      { preferences: { theme } },
      { merge: true },
    );
  }

  async updateDefaultLocation(user: User, defaultLocation: DefaultLocationPreference): Promise<void> {
    this.assertSignedIn(user);

    const { api, firestore } = await this.firestoreApi();
    await api.setDoc(
      api.doc(firestore, 'userInfo', user.uid),
      { preferences: { defaultLocation } },
      { merge: true },
    );
  }

  async updateUserName(user: User, userName: string): Promise<void> {
    this.assertSignedIn(user);

    const { api, firestore } = await this.firestoreApi();
    await api.setDoc(api.doc(firestore, 'userInfo', user.uid), { userName }, { merge: true });
  }

  async createCustomWorkout(user: User, workout: { name: string; description: string; details: string }): Promise<any> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const customWorkoutsRef = api.collection(firestore, 'userInfo', user.uid, 'customWorkouts');
    const docRef = await api.addDoc(customWorkoutsRef, workout);
    return { id: docRef.id, ...workout };
  }

  async getCustomWorkouts(user: User): Promise<any[]> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const customWorkoutsRef = api.collection(firestore, 'userInfo', user.uid, 'customWorkouts');
    const snapshot = await api.getDocs(customWorkoutsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async deleteCustomWorkout(user: User, workoutId: string): Promise<void> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    await api.deleteDoc(api.doc(firestore, 'userInfo', user.uid, 'customWorkouts', workoutId));
  }

  async addFoodEntry(user: User, dateKey: string, entry: FoodLogEntry): Promise<void> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    await api.setDoc(
      api.doc(firestore, 'userInfo', user.uid, 'nutrition', dateKey),
      { entries: api.arrayUnion(stripUndefined(entry)) },
      { merge: true },
    );
  }

  /** Removes one entry by id, and deletes the day's document when it becomes empty. */
  async removeFoodEntry(user: User, dateKey: string, entryId: string): Promise<void> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const dayRef = api.doc(firestore, 'userInfo', user.uid, 'nutrition', dateKey);
    const snapshot = await api.getDoc(dayRef);
    const entries = ((snapshot.data()?.['entries'] ?? []) as FoodLogEntry[]).filter(
      (entry) => entry.id !== entryId,
    );
    if (entries.length === 0) {
      await api.deleteDoc(dayRef);
    } else {
      await api.setDoc(dayRef, { entries });
    }
  }

  /** Date keys (dd-mm-yyyy) of every day that has at least one entry. */
  async getFoodLogDates(user: User): Promise<string[]> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const snapshot = await api.getDocs(api.collection(firestore, 'userInfo', user.uid, 'nutrition'));
    return snapshot.docs
      .filter((day) => ((day.data()['entries'] ?? []) as unknown[]).length > 0)
      .map((day) => day.id);
  }

  async getFoodLogDay(user: User, dateKey: string): Promise<FoodLogEntry[]> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const snapshot = await api.getDoc(api.doc(firestore, 'userInfo', user.uid, 'nutrition', dateKey));
    return (snapshot.data()?.['entries'] ?? []) as FoodLogEntry[];
  }

  async createCustomFood(user: User, food: Omit<CustomFood, 'id'>): Promise<CustomFood> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const docRef = await api.addDoc(
      api.collection(firestore, 'userInfo', user.uid, 'customFoods'),
      stripUndefined(food),
    );
    return { id: docRef.id, ...stripUndefined(food) };
  }

  async getCustomFoods(user: User): Promise<CustomFood[]> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    const snapshot = await api.getDocs(api.collection(firestore, 'userInfo', user.uid, 'customFoods'));
    return snapshot.docs.map((food) => ({ ...(food.data() as Omit<CustomFood, 'id'>), id: food.id }));
  }

  /** Replaces the food, so macros that were cleared are removed from the document. */
  async updateCustomFood(user: User, food: CustomFood): Promise<void> {
    this.assertSignedIn(user);
    const { id, ...data } = food;
    const { api, firestore } = await this.firestoreApi();
    await api.setDoc(api.doc(firestore, 'userInfo', user.uid, 'customFoods', id), stripUndefined(data));
  }

  async deleteCustomFood(user: User, foodId: string): Promise<void> {
    this.assertSignedIn(user);
    const { api, firestore } = await this.firestoreApi();
    await api.deleteDoc(api.doc(firestore, 'userInfo', user.uid, 'customFoods', foodId));
  }
  private assertSignedIn(user: User): void {
    if (this.auth.currentUser?.uid !== user.uid) {
      throw new Error('A matching signed-in user is required for this operation.');
    }
  }
}
