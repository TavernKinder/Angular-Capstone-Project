import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forcast } from './forcast';

describe('Forcast', () => {
  let component: Forcast;
  let fixture: ComponentFixture<Forcast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forcast],
    }).compileComponents();

    fixture = TestBed.createComponent(Forcast);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
