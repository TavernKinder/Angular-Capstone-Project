import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth/auth';

import { Footer } from './footer';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;
  let authService: {
    currentUser: WritableSignal<{ uid: string } | null>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      currentUser: signal({ uid: 'user-123' }),
      logout: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows logout when a user is signed in and hides it otherwise', async () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Logout');

    authService.currentUser.set(null);
    const signedOutFixture = TestBed.createComponent(Footer);
    await signedOutFixture.whenStable();

    expect((signedOutFixture.nativeElement as HTMLElement).textContent).not.toContain('Logout');
  });
});
