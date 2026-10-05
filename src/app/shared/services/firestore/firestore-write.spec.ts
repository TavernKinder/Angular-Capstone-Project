import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FirestoreWriteService } from './firestore-write';

const { docMock, getDocMock, serverTimestampMock, setDocMock } = vi.hoisted(() => ({
  docMock: vi.fn(() => 'user-profile-ref'),
  getDocMock: vi.fn().mockResolvedValue({ exists: () => false }),
  serverTimestampMock: vi.fn(() => 'server-timestamp'),
  setDocMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@angular/fire/firestore', () => {
  return {
    Firestore: class {},
    doc: docMock,
    getDoc: getDocMock,
    serverTimestamp: serverTimestampMock,
    setDoc: setDocMock,
  };
});

describe('FirestoreWriteService', () => {
  let service: FirestoreWriteService;
  const auth = { currentUser: { uid: 'user-123' } };
  const firestore = {};
  const user = { uid: 'user-123', email: 'person@example.com' } as User;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Firestore, useValue: firestore },
      ],
    });
    service = TestBed.inject(FirestoreWriteService);
  });

  it('writes a profile to the authenticated user document', async () => {
    await service.createUserProfile(user);

    expect(docMock).toHaveBeenCalledWith(firestore, 'userInfo', 'user-123');
    expect(getDocMock).toHaveBeenCalledWith('user-profile-ref');
    expect(setDocMock).toHaveBeenCalledWith('user-profile-ref', {
      uid: 'user-123',
      email: 'person@example.com',
      createdAt: 'server-timestamp',
    });
  });

  it('rejects writes for another user', async () => {
    await expect(service.createUserProfile({ ...user, uid: 'other-user' } as User)).rejects.toThrow(
      'A matching signed-in user is required',
    );
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('does not overwrite an existing profile', async () => {
    getDocMock.mockResolvedValueOnce({ exists: () => true });

    await service.createUserProfile(user);

    expect(setDocMock).not.toHaveBeenCalled();
  });
});
