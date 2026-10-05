import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    const loggedOut = await this.authService.logout();
    if (loggedOut) {
      await this.router.navigateByUrl('/');
    }
  }
}
