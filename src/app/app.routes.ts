import { Routes } from '@angular/router';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { Home } from './home/home';
import { About } from './about/about';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { DashboardLayout } from './shared/layouts/dashboard-layout/dashboard-layout';
import { DashboardHome } from './dashboard/dashboard-home/dashboard-home';
import { Forcast } from './dashboard/forcast/forcast';
import { Nutrition } from './dashboard/nutrition/nutrition';
import { Workout } from './dashboard/workout/workout';
import { Account } from './dashboard/account/account';
import { authGuard } from './shared/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'login', component: Login },
      { path: 'signup', component: Signup },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardHome },
      { path: 'forcast', component: Forcast },
      { path: 'nutrition', component: Nutrition },
      { path: 'workout', component: Workout },
      { path: 'account', component: Account },
      // { path: 'account/logout', component: Logout }, // TODO: add logout component/logic
    ],
  },
];
