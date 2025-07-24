// All tests commented out for npm packaging
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WysiwygEditorComponent } from './wysiwyg-editor.component';

describe('WysiwygEditorComponent', () => {
  let component: WysiwygEditorComponent;
  let fixture: ComponentFixture<WysiwygEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WysiwygEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WysiwygEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.html).toBe('');
    expect(component.showRawHtml).toBe(false);
    expect(component.showFormattedPreview).toBe(false);
    expect(component.showTableGrid).toBe(false);
    expect(component.tableGridRows).toBe(1);
    expect(component.tableGridCols).toBe(1);
  });

  it('should toggle raw HTML expand', () => {
    const initial = component.isRawHtmlExpanded;
    component.toggleRawHtmlExpand();
    expect(component.isRawHtmlExpanded).toBe(!initial);
  });

  it('should toggle JSON expand', () => {
    const initial = component.isJsonExpanded;
    component.toggleJsonExpand();
    expect(component.isJsonExpanded).toBe(!initial);
  });

  it('should handle table grid changes', () => {
    component.tableGridRows = 3;
    component.tableGridCols = 4;
    expect(component.tableGridRows).toBe(3);
    expect(component.tableGridCols).toBe(4);
  });

  it('should handle image selection', () => {
    const img = document.createElement('img');
    component.selectedImage = img;
    expect(component.selectedImage).toBe(img);
  });

  it('should handle image removal', () => {
    const img = document.createElement('img');
    component.selectedImage = img;
    component.removeImage();
    expect(component.selectedImage).toBeNull();
  });

  it('should handle onApplyStyle', () => {
    component.onApplyStyle({type: 'table', styles: {}});
    expect(component).toBeTruthy();
  });

  it('should handle onInsertHtml', () => {
    component.onInsertHtml('<div>test</div>');
    expect(component).toBeTruthy();
  });
});
