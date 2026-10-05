import { TestBed } from '@angular/core/testing';

import { ErrorModalService } from './error-modal';

describe('ErrorModalService', () => {
  let errorModal: ErrorModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    errorModal = TestBed.inject(ErrorModalService);
  });

  it('stores a single trimmed error message', () => {
    errorModal.showError('  Unable to load data.  ');

    expect(errorModal.message()).toBe('Unable to load data.');
  });

  it('does not replace the same error message twice', () => {
    errorModal.showError('Unable to load data.');
    const firstMessage = errorModal.message();

    errorModal.showError('Unable to load data.');

    expect(errorModal.message()).toBe(firstMessage);
  });
});
