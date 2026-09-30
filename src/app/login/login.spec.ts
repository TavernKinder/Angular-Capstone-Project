import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Login } from './login';
import { AuthService } from '../shared/services/auth/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: {
    login: ReturnType<typeof vi.fn>;
    loginWithGoogle: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    authService = {
      login: vi.fn().mockResolvedValue(undefined),
      loginWithGoogle: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reports missing required values', () => {
    component.onSubmit();
    expect(component.loginError).toBe('Enter your email and password.');
    expect(component.loginForm.invalid).toBe(true);
  });

  it('signs in and navigates to the dashboard on valid details', async () => {
    component.loginForm.setValue({ email: 'person@example.com', password: 'password' });
    await component.onSubmit();
    expect(authService.login).toHaveBeenCalledWith('person@example.com', 'password');
    expect(component.loginError).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('surfaces the auth service error when sign in fails', async () => {
    authService.login.mockRejectedValue(new Error('failed'));
    authService.error.mockReturnValue('Incorrect email or password.');
    component.loginForm.setValue({ email: 'person@example.com', password: 'password' });
    await component.onSubmit();
    expect(component.loginError).toBe('Incorrect email or password.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
