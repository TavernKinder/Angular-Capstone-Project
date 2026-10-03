import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { Weather } from './weather';

describe('Weather', () => {
  let service: Weather;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(Weather);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
