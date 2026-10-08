import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthService } from '../../shared/services/auth/auth';
import { FirestoreWriteService } from '../../shared/services/firestore/firestore-write';
import { RoutineService } from '../../shared/services/routine/routine';
import { Weather } from '../../shared/services/weather/weather';
import { DashboardHome } from './dashboard-home';

describe('DashboardHome', () => {
  let component: DashboardHome;
  let fixture: ComponentFixture<DashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHome],
      providers: [
        provideRouter([]),
        {
          provide: RoutineService,
          useValue: {
            routines: signal([]),
            isLoading: signal(false),
            error: signal(null),
            deleteRoutine: vi.fn(),
          },
        },
        { provide: AuthService, useValue: { currentUser: signal(null) } },
        { provide: FirestoreWriteService, useValue: { getUserProfile: vi.fn().mockResolvedValue(null) } },
        {
          provide: Weather,
          useValue: {
            weatherData: signal(null),
            locationName: signal(''),
            isLoading: signal(false),
            error: signal(null),
            loadWeatherForDeviceLocation: vi.fn().mockResolvedValue(undefined),
            loadWeatherForLocation: vi.fn().mockResolvedValue(undefined),
            loadDefaultLocation: vi.fn().mockResolvedValue(undefined),
          },
        },
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
