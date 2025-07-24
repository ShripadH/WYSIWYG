import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WysiwygEditorLibComponent } from './wysiwyg-editor-lib.component';

describe('WysiwygEditorLibComponent', () => {
  let component: WysiwygEditorLibComponent;
  let fixture: ComponentFixture<WysiwygEditorLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WysiwygEditorLibComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WysiwygEditorLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
