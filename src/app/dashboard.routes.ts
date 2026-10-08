import { Routes } from '@angular/router';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { RoutineService } from './shared/services/routine/routine';
import { DashboardLayout } from './shared/layouts/dashboard-layout/dashboard-layout';
import { invalidDashboardRouteGuard } from './shared/guards/route-not-found-guards';
import { RouteRedirectPlaceholder } from './shared/components/route-redirect-placeholder/route-redirect-placeholder';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayout,
    providers: [provideFirestore(() => getFirestore()), RoutineService],
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
];
