import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Signup } from './signup';
import { AuthService } from '../shared/services/auth/auth';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authService: { signup: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = {
      signup: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects mismatched passwords', () => {
    component.signupForm.setValue({
      email: 'person@example.com',
      password: 'secure-pass',
      confirmPassword: 'different-pass',
    });
    component.onSubmit();
    expect(component.signupError).toBe('Passwords do not match.');
  });

  it('creates the account and navigates to the dashboard on valid details', async () => {
    component.signupForm.setValue({
      email: 'person@example.com',
      password: 'secure-pass',
      confirmPassword: 'secure-pass',
    });
    await component.onSubmit();
    expect(authService.signup).toHaveBeenCalledWith('person@example.com', 'secure-pass');
    expect(component.signupError).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('surfaces the auth service error when sign up fails', async () => {
    authService.signup.mockRejectedValue(new Error('failed'));
    authService.error.mockReturnValue('An account with this email already exists.');
    component.signupForm.setValue({
      email: 'person@example.com',
      password: 'secure-pass',
      confirmPassword: 'secure-pass',
    });
    await component.onSubmit();
    expect(component.signupError).toBe('An account with this email already exists.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
