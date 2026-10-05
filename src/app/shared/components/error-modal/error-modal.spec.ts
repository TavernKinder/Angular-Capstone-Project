import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorModalService } from '../../services/error-modal/error-modal';

import { ErrorModal } from './error-modal';

describe('ErrorModal', () => {
  let component: ErrorModal;
  let fixture: ComponentFixture<ErrorModal>;
  let errorModal: ErrorModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorModal);
    component = fixture.componentInstance;
    errorModal = TestBed.inject(ErrorModalService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stays hidden until an error is set', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('.error-overlay')).toBeNull();
  });

  it('shows the error and closes it when the Close button is clicked', () => {
    errorModal.showError('Unable to load the page.');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alertdialog"]')?.textContent).toContain(
      'Unable to load the page.',
    );

    element.querySelector('button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(element.querySelector('.error-overlay')).toBeNull();
  });
});
