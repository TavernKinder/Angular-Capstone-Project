import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorModalService {
  readonly message = signal<string | null>(null);

  showError(message: string): void {
    const nextMessage = message.trim();
    if (!nextMessage) {
      this.dismiss();
      return;
    }
    if (this.message() === nextMessage) return;
    this.message.set(nextMessage);
  }

  dismiss(): void {
    this.message.set(null);
  }
}
