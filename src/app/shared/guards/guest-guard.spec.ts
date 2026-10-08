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

import { guestGuard } from './guest-guard';

const { authStateMock } = vi.hoisted(() => ({ authStateMock: vi.fn() }));

vi.mock('@angular/fire/auth', async (importOriginal) => ({
  Auth: (await importOriginal<typeof import('@angular/fire/auth')>()).Auth,
  authState: authStateMock,
}));

describe('guestGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Auth, useValue: {} }],
    });
    router = TestBed.inject(Router);
  });

  it('allows a signed-out user', async () => {
    authStateMock.mockReturnValue(of(null));

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    await expect(firstValueFrom(result as ReturnType<typeof of>)).resolves.toBe(true);
  });

  it('redirects a signed-in user to the dashboard', async () => {
    authStateMock.mockReturnValue(of({ uid: 'user-123' }));

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    const redirect = await firstValueFrom(result as ReturnType<typeof of>);
    expect(redirect).toEqual(router.parseUrl('/dashboard'));
  });
});
