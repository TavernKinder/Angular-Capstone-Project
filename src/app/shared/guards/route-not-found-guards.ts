import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ErrorModalService } from '../services/error-modal/error-modal';

export const invalidPublicRouteGuard: CanActivateFn = () => {
  inject(ErrorModalService).showError('That page does not exist. We sent you back home.');
  return inject(Router).parseUrl('/');
};

export const invalidDashboardRouteGuard: CanActivateFn = () => {
  inject(ErrorModalService).showError(
    'That dashboard page does not exist. We sent you to your dashboard.',
  );
  return inject(Router).parseUrl('/dashboard');
};
