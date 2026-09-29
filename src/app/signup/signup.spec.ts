import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
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

  it('validates details and reports the missing auth integration', () => {
    component.signupForm.setValue({
      email: 'person@example.com',
      password: 'secure-pass',
      confirmPassword: 'secure-pass',
    });
    component.onSubmit();
    expect(component.signupError).toBeNull();
    expect(component.signupMessage).toContain('authentication service');
  });
});
