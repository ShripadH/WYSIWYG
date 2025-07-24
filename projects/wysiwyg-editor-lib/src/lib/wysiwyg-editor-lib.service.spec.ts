import { TestBed } from '@angular/core/testing';

import { WysiwygEditorLibService } from './wysiwyg-editor-lib.service';

describe('WysiwygEditorLibService', () => {
  let service: WysiwygEditorLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WysiwygEditorLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
