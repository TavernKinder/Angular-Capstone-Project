import { Component, HostListener, inject } from '@angular/core';
import { ErrorModalService } from '../../services/error-modal/error-modal';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.css',
})
export class ErrorModal {
  readonly errorModal = inject(ErrorModalService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.errorModal.message()) {
      this.close();
    }
  }

  close(): void {
    this.errorModal.dismiss();
  }
}
