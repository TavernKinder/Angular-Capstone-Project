import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklySchedule } from './weekly-schedule';

describe('WeeklySchedule', () => {
  let component: WeeklySchedule;
  let fixture: ComponentFixture<WeeklySchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklySchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklySchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
