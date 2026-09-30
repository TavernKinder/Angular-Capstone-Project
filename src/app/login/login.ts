import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../shared/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitted = false;
  authInProgress = false;
  loginError: string | null = null;
  loginMessage: string | null = null;

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.loginError = null;
    this.loginMessage = null;

    const email = this.loginForm.controls.email;
    const password = this.loginForm.controls.password;

    switch (true) {
      case email.hasError('required') || password.hasError('required'):
        this.loginError = 'Enter your email and password.';
        this.loginForm.markAllAsTouched();
        break;
      case email.hasError('email'):
        this.loginError = 'Enter a valid email address.';
        email.markAsTouched();
        break;
      case !this.loginForm.valid:
        this.loginError = 'Check the information you entered.';
        this.loginForm.markAllAsTouched();
        break;
      default:
        await this.signIn(email.value!, password.value!);
        break;
    }
  }

  async onGoogleSignIn(): Promise<void> {
    this.loginError = null;
    this.authInProgress = true;
    try {
      await this.authService.loginWithGoogle();
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.loginError = this.authService.error() ?? 'Unable to sign in with Google.';
    } finally {
      this.authInProgress = false;
    }
  }

  private async signIn(email: string, password: string): Promise<void> {
    this.authInProgress = true;
    try {
      await this.authService.login(email, password);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.loginError = this.authService.error() ?? 'Unable to log in.';
    } finally {
      this.authInProgress = false;
    }
  }
}
