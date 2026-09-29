import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
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

  it('validates details and reports the missing auth integration', () => {
    component.loginForm.setValue({ email: 'person@example.com', password: 'password' });
    component.onSubmit();
    expect(component.loginError).toBeNull();
    expect(component.loginMessage).toContain('authentication service');
  });
});
