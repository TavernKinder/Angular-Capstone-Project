import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DashboardHome } from './dashboard-home';

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  user: () => of({ uid: 'test-user-123' }),
}));

describe('DashboardHome', () => {
  let component: DashboardHome;
  let fixture: ComponentFixture<DashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHome],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Auth, useValue: { currentUser: { uid: 'test-user-123' } } },
        { provide: Firestore, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });
});
