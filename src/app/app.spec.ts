import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ThemeService } from './shared/services/theme/theme';

describe('App', () => {
  const theme = signal<'light' | 'dark'>('light');

  beforeEach(async () => {
    theme.set('light');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ThemeService, useValue: { theme } }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, capstoneProject');
  });
});
