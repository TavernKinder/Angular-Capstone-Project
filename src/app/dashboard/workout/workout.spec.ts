import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Workout } from './workout';

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  user: () => of({ uid: 'test-user-123' }),
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
