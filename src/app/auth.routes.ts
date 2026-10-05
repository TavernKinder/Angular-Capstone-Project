import { Routes } from '@angular/router';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { AuthService } from './shared/services/auth/auth';
import { FirestoreWriteService } from './shared/services/firestore/firestore-write';

const authPageProviders = [provideFirestore(() => getFirestore()), FirestoreWriteService, AuthService];

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    providers: authPageProviders,
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
];

export const SIGNUP_ROUTES: Routes = [
  {
    path: '',
    providers: authPageProviders,
    loadComponent: () => import('./signup/signup').then((m) => m.Signup),
  },
];
