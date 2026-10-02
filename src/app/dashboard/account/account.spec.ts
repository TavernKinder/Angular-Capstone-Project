import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';

import { Account } from './account';

describe('Account', () => {
  let component: Account;
  let fixture: ComponentFixture<Account>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Account],
      providers: [
        { provide: AuthService, useValue: { currentUser: () => null } },
        { provide: FirestoreWriteService, useValue: { getUserProfile: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Account);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
