import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authGuard } from './auth-guard';
import { ErrorModalService } from '../services/error-modal/error-modal';

const { authStateMock } = vi.hoisted(() => ({ authStateMock: vi.fn() }));

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  authState: authStateMock,
}));

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Auth, useValue: {} }],
    });
    router = TestBed.inject(Router);
  });

  it('allows a signed-in user', async () => {
    authStateMock.mockReturnValue(of({ uid: 'user-123' }));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    await expect(firstValueFrom(result as ReturnType<typeof of>)).resolves.toBe(true);
  });

  it('redirects a signed-out user to login', async () => {
    authStateMock.mockReturnValue(of(null));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    const redirect = await firstValueFrom(result as ReturnType<typeof of>);
    expect(redirect).toEqual(router.parseUrl('/login'));
    expect(TestBed.inject(ErrorModalService).message()).toBe(
      'Please log in to access the dashboard.',
    );
  });
});
