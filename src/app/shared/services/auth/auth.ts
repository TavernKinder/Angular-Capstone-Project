import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  User,
} from '@angular/fire/auth';
import { FirestoreWriteService } from '../firestore/firestore-write';

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Use a stronger password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/requires-recent-login':
      return 'Please log in again before making this change.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestoreWriteService = inject(FirestoreWriteService);

  // Reflects the current Firebase auth state as a signal for template use
  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    authState(this.auth).subscribe((user: User | null) => this.currentUser.set(user));
  }

  async login(email: string, password: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (err) {
      this.error.set(mapAuthError(err));
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signup(email: string, password: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.firestoreWriteService.createUserProfile(credential.user);
    } catch (err) {
      this.error.set(mapAuthError(err));
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const credential = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.firestoreWriteService.createUserProfile(credential.user);
    } catch (err) {
      this.error.set(mapAuthError(err));
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const user = this.auth.currentUser;
      if (!user?.email) throw new Error('A signed-in user with an email is required.');

      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, currentPassword),
      );
      await updatePassword(user, newPassword);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const isWrongPassword = code === 'auth/wrong-password' || code === 'auth/invalid-credential';
      this.error.set(isWrongPassword ? 'Current password is incorrect.' : mapAuthError(err));
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
