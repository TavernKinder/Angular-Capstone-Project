import { Component, input, output } from '@angular/core';
import { Dialog } from '../dialog/dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Dialog],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Delete');
  readonly isBusy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
