import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashFooter } from './dash-footer';

describe('DashFooter', () => {
  let component: DashFooter;
  let fixture: ComponentFixture<DashFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(DashFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
