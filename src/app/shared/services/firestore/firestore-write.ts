import { Injectable, inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { doc, Firestore, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';

export type ThemePreference = 'light' | 'dark';

export interface UserProfile {
  uid: string;
  email: string | null;
  preferences?: { theme?: ThemePreference };
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
      uid: user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
    });
  }

  async getUserProfile(user: User): Promise<UserProfile | null> {
    this.assertSignedIn(user);

    const snapshot = await getDoc(doc(this.firestore, 'userInfo', user.uid));
    return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
  }

  async updateTheme(user: User, theme: ThemePreference): Promise<void> {
    this.assertSignedIn(user);

    // uid is included so the merge also satisfies the create/update rules.
    await setDoc(
      doc(this.firestore, 'userInfo', user.uid),
      { uid: user.uid, preferences: { theme } },
      { merge: true },
    );
  }

  private assertSignedIn(user: User): void {
    if (this.auth.currentUser?.uid !== user.uid) {
      throw new Error('A matching signed-in user is required for this operation.');
    }
  }
}
