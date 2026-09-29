import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashHeader } from './dash-header';

describe('DashHeader', () => {
  let component: DashHeader;
  let fixture: ComponentFixture<DashHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(DashHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
