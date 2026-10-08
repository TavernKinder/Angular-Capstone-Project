import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorModalService } from '../error-modal/error-modal';
import { RoutineService } from './routine';

const { deleteDocMock } = vi.hoisted(() => ({ deleteDocMock: vi.fn() }));

vi.mock('@angular/fire/auth', async (importOriginal) => ({
  Auth: (await importOriginal<typeof import('@angular/fire/auth')>()).Auth,
  user: () => of(null),
}));

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  addDoc: vi.fn(),
  deleteDoc: deleteDocMock,
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('RoutineService', () => {
  let service: RoutineService;
  let errorModal: ErrorModalService;

  beforeEach(() => {
    deleteDocMock.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: { currentUser: { uid: 'user-123' } } },
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(RoutineService);
    errorModal = TestBed.inject(ErrorModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('removes a routine after a successful delete', async () => {
    deleteDocMock.mockResolvedValue(undefined);
    service.routines.set([{ id: 'a', exerciseName: 'Pushups', minutes: 10, reps: 5 }]);

    await service.deleteRoutine('a');

    expect(service.routines()).toEqual([]);
    expect(errorModal.message()).toBeNull();
  });

  it('shows an error popup and keeps the routine when the delete fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    deleteDocMock.mockRejectedValue(new Error('permission-denied'));
    service.routines.set([{ id: 'a', exerciseName: 'Pushups', minutes: 10, reps: 5 }]);

    await service.deleteRoutine('a');

    expect(errorModal.message()).toBe('Unable to delete this saved workout. Please try again.');
    expect(service.routines().map((r) => r.id)).toEqual(['a']);
  });
});