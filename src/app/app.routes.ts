import { Routes } from '@angular/router';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { Home } from './home/home';
import { About } from './about/about';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { DashboardLayout } from './shared/layouts/dashboard-layout/dashboard-layout';
import { authGuard } from './shared/guards/auth-guard';
import { guestGuard } from './shared/guards/guest-guard';
import {
  invalidDashboardRouteGuard,
  invalidPublicRouteGuard,
} from './shared/guards/route-not-found-guards';
import { RouteRedirectPlaceholder } from './shared/components/route-redirect-placeholder/route-redirect-placeholder';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/dashboard-home/dashboard-home').then((m) => m.DashboardHome),
      },
      {
        path: 'forcast',
        loadComponent: () => import('./dashboard/forcast/forcast').then((m) => m.Forcast),
      },
      {
        path: 'nutrition',
        loadComponent: () => import('./dashboard/nutrition/nutrition').then((m) => m.Nutrition),
      },
      {
        path: 'workout',
        loadComponent: () => import('./dashboard/workout/workout').then((m) => m.Workout),
      },
      {
        path: 'account',
        loadComponent: () => import('./dashboard/account/account').then((m) => m.Account),
      },
      {
        path: '**',
        component: RouteRedirectPlaceholder,
        canActivate: [invalidDashboardRouteGuard],
      },
    ],
  },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'login', component: Login, canActivate: [guestGuard] },
      { path: 'signup', component: Signup, canActivate: [guestGuard] },
      {
        path: '**',
        component: RouteRedirectPlaceholder,
        canActivate: [invalidPublicRouteGuard],
      },
    ],
  },
];
