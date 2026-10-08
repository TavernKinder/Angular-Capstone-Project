import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cycles through slides and ignores navigation when there are none', () => {
    component.slides.length = 0;
    component.showNext();
    expect(component.activeSlideIndex).toBe(0);

    component.slides.push(
      { id: 'first', title: 'First', description: 'First slide' },
      { id: 'second', title: 'Second', description: 'Second slide' },
    );
    component.showPrevious();
    expect(component.activeSlideIndex).toBe(1);
    component.showNext();
    expect(component.activeSlideIndex).toBe(0);
  });
});
