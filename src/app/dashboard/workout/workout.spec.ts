import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../shared/services/auth/auth';
import { RoutineService } from '../../shared/services/routine/routine';
import { Workout } from './workout';

vi.mock('@angular/fire/auth', async (importOriginal) => ({
  Auth: (await importOriginal<typeof import('@angular/fire/auth')>()).Auth,
  user: () => of({ uid: 'test-user-123' }),
  authState: () => of({ uid: 'test-user-123' }),
}));

describe('Workout', () => {
  let component: Workout;
  let fixture: ComponentFixture<Workout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Auth,
          useValue: { currentUser: { uid: 'test-user-123' } },
        },
        {
          provide: AuthService,
          useValue: { currentUser: signal({ uid: 'test-user-123' }) },
        },
        {
          provide: RoutineService,
          useValue: {
            routines: signal([]),
            isLoading: signal(false),
            error: signal(null),
            addRoutine: vi.fn(),
            deleteRoutine: vi.fn(),
          },
        },
        {
          provide: Firestore,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Workout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });
});
