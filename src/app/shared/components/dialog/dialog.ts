import { Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal shell: backdrop, X button, Escape to close, focus trap and dialog semantics. */
@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  host: {
    '(document:keydown.escape)': 'closed.emit()',
    '(keydown.tab)': 'trapFocus($event)',
  },
})
export class Dialog {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly heading = input.required<string>();
  readonly closed = output<void>();

  protected readonly titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;

  constructor() {
    afterNextRender(() => this.focusables()[0]?.focus());
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus?.();
  }

  protected trapFocus(event: Event): void {
    const items = this.focusables();
    if (items.length === 0) return;

    const shift = (event as KeyboardEvent).shiftKey;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (shift && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!shift && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE));
  }
}
