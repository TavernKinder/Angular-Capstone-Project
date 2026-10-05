import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { ErrorModalService } from './shared/services/error-modal/error-modal';
import { routes } from './app.routes';
import {
  invalidDashboardRouteGuard,
  invalidPublicRouteGuard,
} from './shared/guards/route-not-found-guards';

describe('unknown route guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  it('returns home and reports an invalid public route', () => {
    const result = TestBed.runInInjectionContext(() =>
      invalidPublicRouteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['parseUrl']>)).toBe('/');
    expect(TestBed.inject(ErrorModalService).message()).toContain('page does not exist');
  });

  it('returns to the dashboard and reports an invalid dashboard route', () => {
    const result = TestBed.runInInjectionContext(() =>
      invalidDashboardRouteGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['parseUrl']>)).toBe(
      '/dashboard',
    );
    expect(TestBed.inject(ErrorModalService).message()).toContain('dashboard page does not exist');
  });
});
