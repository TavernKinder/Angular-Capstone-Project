import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { ErrorModalService } from '../services/error-modal/error-modal';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const errorModal = inject(ErrorModalService);

  return authState(auth).pipe(
    take(1),
    map((user) => {
      if (user) return true;
      errorModal.showError('Please log in to access the dashboard.');
      return router.createUrlTree(['/login']);
    }),
  );
};
