import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutineService } from './routine';

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  user: () => of({ uid: 'user-123' }),
}));

describe('RoutineService', () => {
  let service: RoutineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: { currentUser: { uid: 'user-123' } } },
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(RoutineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
