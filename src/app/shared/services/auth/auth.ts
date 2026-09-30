import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from '@angular/fire/auth';

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
    default:
      return 'Something went wrong. Please try again.';
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);

  // Reflects the current Firebase auth state as a signal for template use
  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    authState(this.auth).subscribe((user) => this.currentUser.set(user));
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
      await createUserWithEmailAndPassword(this.auth, email, password);
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
      await signInWithPopup(this.auth, new GoogleAuthProvider());
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
}
