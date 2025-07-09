import { TestBed } from '@angular/core/testing';

import { ThymeleafRenderService } from './thymeleaf-render.service';

describe('ThymeleafRenderService', () => {
  let service: ThymeleafRenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThymeleafRenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
