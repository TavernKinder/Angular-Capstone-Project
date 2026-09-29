import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return !password || !confirmPassword || password === confirmPassword
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private readonly formBuilder = inject(FormBuilder);
  readonly signupForm = this.formBuilder.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  submitted = false;
  signupError: string | null = null;
  signupMessage: string | null = null;

  onSubmit(): void {
    this.submitted = true;
    this.signupError = null;
    this.signupMessage = null;

    const email = this.signupForm.controls.email;
    const password = this.signupForm.controls.password;
    const confirmPassword = this.signupForm.controls.confirmPassword;

    switch (true) {
      case email.hasError('required') ||
        password.hasError('required') ||
        confirmPassword.hasError('required'):
        this.signupError = 'Complete all fields to continue.';
        this.signupForm.markAllAsTouched();
        break;
      case email.hasError('email'):
        this.signupError = 'Enter a valid email address.';
        email.markAsTouched();
        break;
      case password.hasError('minlength'):
        this.signupError = 'Use a password with at least 8 characters.';
        password.markAsTouched();
        break;
      case this.signupForm.hasError('passwordMismatch'):
        this.signupError = 'Passwords do not match.';
        confirmPassword.markAsTouched();
        break;
      case !this.signupForm.valid:
        this.signupError = 'Check the information you entered.';
        this.signupForm.markAllAsTouched();
        break;
      default:
        this.signupMessage =
          'Your details are valid. An authentication service is needed to create an account.';
        break;
    }
  }
}
