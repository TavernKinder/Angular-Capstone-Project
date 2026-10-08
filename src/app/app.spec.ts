import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ThemeService } from './shared/services/theme/theme';

describe('App', () => {
  const theme = signal<'light' | 'dark'>('light');

  beforeEach(async () => {
    theme.set('light');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: ThemeService, useValue: { theme } }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
