import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitted = false;
  loginError: string | null = null;
  loginMessage: string | null = null;

  onSubmit(): void {
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
        this.loginMessage =
          'Your details are valid. An authentication service is needed to sign in.';
        break;
    }
  }
}
