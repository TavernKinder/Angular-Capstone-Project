import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';

import { AuthService } from './auth';
import { FirestoreWriteService } from '../firestore/firestore-write';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: { onAuthStateChanged: () => () => {} } },
        { provide: FirestoreWriteService, useValue: { createUserProfile: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
