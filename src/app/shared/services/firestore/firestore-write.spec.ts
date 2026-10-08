import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FirestoreWriteService } from './firestore-write';

const { addDocMock, arrayUnionMock, collectionMock, deleteDocMock, docMock, getDocMock, getDocsMock, getFirestoreMock, setDocMock } = vi.hoisted(() => ({
  addDocMock: vi.fn().mockResolvedValue({ id: 'new-document' }),
  arrayUnionMock: vi.fn((...values: unknown[]) => ({ union: values })),
  collectionMock: vi.fn(() => 'collection-ref'),
  deleteDocMock: vi.fn().mockResolvedValue(undefined),
  docMock: vi.fn(() => 'user-profile-ref'),
  getDocMock: vi.fn().mockResolvedValue({ exists: () => false }),
  getDocsMock: vi.fn().mockResolvedValue({ docs: [] }),
  getFirestoreMock: vi.fn(() => 'firestore-instance'),
  setDocMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: addDocMock,
  arrayUnion: arrayUnionMock,
  collection: collectionMock,
  deleteDoc: deleteDocMock,
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  getFirestore: getFirestoreMock,
  setDoc: setDocMock,
}));

describe('FirestoreWriteService', () => {
  let service: FirestoreWriteService;
  const auth = { currentUser: { uid: 'user-123' } };
  const firestore = 'firestore-instance';
  const user = { uid: 'user-123', email: 'person@example.com' } as User;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: auth }],
    });
    service = TestBed.inject(FirestoreWriteService);
  });

  it('writes a profile to the authenticated user document', async () => {
    await service.createUserProfile(user);

    expect(docMock).toHaveBeenCalledWith(firestore, 'userInfo', 'user-123');
    expect(getDocMock).toHaveBeenCalledWith('user-profile-ref');
    expect(setDocMock).toHaveBeenCalledWith('user-profile-ref', {
      userName: 'person',
      preferences: { theme: 'light' },
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

  it('merges the userName field into the profile', async () => {
    await service.updateUserName(user, 'NewName');

    expect(setDocMock).toHaveBeenCalledWith(
      'user-profile-ref',
      { userName: 'NewName' },
      { merge: true },
    );
  });

  it('merges the theme into the preferences map', async () => {
    await service.updateTheme(user, 'dark');

    expect(setDocMock).toHaveBeenCalledWith(
      'user-profile-ref',
      { preferences: { theme: 'dark' } },
      { merge: true },
    );
  });

  it('loads Firestore only when a profile operation is called', async () => {
    expect(getFirestoreMock).not.toHaveBeenCalled();

    await service.getUserProfile(user);

    expect(getFirestoreMock).toHaveBeenCalledOnce();
  });

  it('rejects username updates for another user', async () => {
    await expect(
      service.updateUserName({ ...user, uid: 'other-user' } as User, 'x'),
    ).rejects.toThrow('A matching signed-in user is required');
    expect(setDocMock).not.toHaveBeenCalled();
  });
});
