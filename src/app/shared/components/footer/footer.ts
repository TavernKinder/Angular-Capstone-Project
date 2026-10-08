import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isConfirmingLogout = signal(false);
  readonly isLoggingOut = signal(false);

  async logout(): Promise<void> {
    this.isLoggingOut.set(true);
    const loggedOut = await this.authService.logout();
    this.isLoggingOut.set(false);
    this.isConfirmingLogout.set(false);
    if (loggedOut) {
      await this.router.navigateByUrl('/');
    }
  }
}
