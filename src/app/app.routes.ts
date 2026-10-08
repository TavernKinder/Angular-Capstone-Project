import { Routes } from '@angular/router';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { authGuard } from './shared/guards/auth-guard';
import { guestGuard } from './shared/guards/guest-guard';
import {
  invalidPublicRouteGuard,
} from './shared/guards/route-not-found-guards';
import { RouteRedirectPlaceholder } from './shared/components/route-redirect-placeholder/route-redirect-placeholder';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'about',
        loadComponent: () => import('./about/about').then((m) => m.About),
      },
      {
        path: 'login',
        loadComponent: () => import('./login/login').then((m) => m.Login),
        canActivate: [guestGuard],
      },
      {
        path: 'signup',
        loadComponent: () => import('./signup/signup').then((m) => m.Signup),
        canActivate: [guestGuard],
      },
      {
        path: '**',
        component: RouteRedirectPlaceholder,
        canActivate: [invalidPublicRouteGuard],
      },
    ],
  },
];
