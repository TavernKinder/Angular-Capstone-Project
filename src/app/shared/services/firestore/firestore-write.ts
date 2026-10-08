import { Injectable, inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { doc, Firestore, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from '@angular/fire/firestore';

export type ThemePreference = 'light' | 'dark';

export interface UserPreferences {
  theme?: ThemePreference;
  // Not implemented yet: reminders and defaultLocation are display-only for now.
  reminders?: string;
  defaultLocation?: string;
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
  private readonly firestore = inject(Firestore);

  async createUserProfile(user: User): Promise<void> {
    this.assertSignedIn(user);

    const profileRef = doc(this.firestore, 'userInfo', user.uid);
    const existingProfile = await getDoc(profileRef);
    if (existingProfile.exists()) return;

    await setDoc(profileRef, {
      userName: user.displayName ?? user.email?.split('@')[0] ?? '',
      preferences: { theme: 'light' },
    });
  }

  async getUserProfile(user: User): Promise<UserProfile | null> {
    this.assertSignedIn(user);

    const snapshot = await getDoc(doc(this.firestore, 'userInfo', user.uid));
    return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
  }

  async updateTheme(user: User, theme: ThemePreference): Promise<void> {
    this.assertSignedIn(user);

    await setDoc(
      doc(this.firestore, 'userInfo', user.uid),
      { preferences: { theme } },
      { merge: true },
    );
  }

  async updateUserName(user: User, userName: string): Promise<void> {
    this.assertSignedIn(user);

    await setDoc(doc(this.firestore, 'userInfo', user.uid), { userName }, { merge: true });
  }

  async createCustomWorkout(user: User, workout: { name: string; description: string; details: string }): Promise<any> {
    this.assertSignedIn(user);
    const customWorkoutsRef = collection(this.firestore, 'userInfo', user.uid, 'customWorkouts');
    const docRef = await addDoc(customWorkoutsRef, workout);
    return { id: docRef.id, ...workout };
  }

  async getCustomWorkouts(user: User): Promise<any[]> {
    this.assertSignedIn(user);
    const customWorkoutsRef = collection(this.firestore, 'userInfo', user.uid, 'customWorkouts');
    const snapshot = await getDocs(customWorkoutsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async deleteCustomWorkout(user: User, workoutId: string): Promise<void> {
    this.assertSignedIn(user);
    const docRef = doc(this.firestore, 'userInfo', user.uid, 'customWorkouts', workoutId);
    await deleteDoc(docRef);
  }

  private assertSignedIn(user: User): void {
    if (this.auth.currentUser?.uid !== user.uid) {
      throw new Error('A matching signed-in user is required for this operation.');
    }
  }
}
