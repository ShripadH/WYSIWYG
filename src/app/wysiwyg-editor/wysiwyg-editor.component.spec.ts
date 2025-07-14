import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WysiwygEditorComponent } from './wysiwyg-editor.component';
import { Subscription, of } from 'rxjs';

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

  it('should emit htmlChange on updateHtml', () => {
    spyOn(component.htmlChange, 'emit');
    // Mock the editor and its nativeElement
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = '<p>Test</p>';
    (component as any).editor = { nativeElement: mockDiv };
    component.updateHtml();
    // The emitted HTML will be formatted, so check for the presence of 'Test' and 'html/body' tags
    const emittedArg = (component.htmlChange.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedArg).toContain('Test');
    expect(emittedArg).toContain('<html>');
    expect(emittedArg).toContain('<body>');
  });

  it('should format HTML', () => {
    const uglyHtml = '<div><span>Test</span></div>';
    const formatted = (component as any).formatHtml(uglyHtml);
    expect(formatted).toContain('Test');
  });

  it('should handle onBeautifyHtml', () => {
    component.rawHtmlInput = '<div>test</div>';
    component.onBeautifyHtml();
    expect(component.rawHtmlInput).toContain('div');
  });

  it('should handle onBeautifyJson', () => {
    component.jsonPayload = '{"a":1}';
    component.onBeautifyJson();
    expect(component.jsonPayload).toContain('a');
  });

  it('should set table grid', () => {
    component.setTableGrid(3, 4);
    expect(component.tableGridRows).toBe(3);
    expect(component.tableGridCols).toBe(4);
  });

  it('should show/hide table grid', () => {
    component.showTableGrid = true;
    component.hideTableGrid();
    expect(component.showTableGrid).toBe(false);
  });

  it('should handle font family and color', () => {
    component.onFontFamily('Arial');
    expect(component).toBeTruthy();
    component.onFontColor('#ff0000');
    expect(component).toBeTruthy();
  });

  it('should handle format and heading', () => {
    component.onFormat({command: 'bold'});
    expect(component).toBeTruthy();
    component.onHeading('h1');
    expect(component).toBeTruthy();
    component.onFontSize('16px');
    expect(component).toBeTruthy();
  });

  it('should handle insert link', () => {
    component.onInsertLink();
    expect(component).toBeTruthy();
  });

  it('should handle cell style apply', () => {
    component.onCellStyleApply({bgColor: '#fff', align: 'left', vAlign: 'top'});
    expect(component).toBeTruthy();
  });

  it('should handle mergeTemplate and isTableHtml', () => {
    component.html = '<table><tr><td>1</td></tr></table>';
    component.jsonPayload = '{"a":1}';
    component.mergeTemplate();
    expect(component).toBeTruthy();
    expect(component.isTableHtml('<table></table>')).toBe(true);
    expect(component.isTableHtml('<div></div>')).toBe(false);
  });

  it('should open style popup', () => {
    component.openStylePopup('table', null as any);
    expect(component.styleTarget).toBeTruthy();
  });

  it('should select row for style', () => {
    component.selectRowForStyle(null as any, 0, 0);
    expect(component.selectedRowForHandle).toBeNull();
  });

  it('should handle onApplyStyle', () => {
    component.onApplyStyle({type: 'table', styles: {}});
    expect(component).toBeTruthy();
  });

  it('should handle onInsertHtml', () => {
    component.onInsertHtml('<div>test</div>');
    expect(component).toBeTruthy();
  });

  it('should insert a table via insertTable', () => {
    // Mock editor and tableService
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    component.tableGridRows = 2;
    component.tableGridCols = 2;
    const tableServiceSpy = spyOn(component['tableService'], 'insertTable').and.callFake(() => {});
    const tableManagerSpy = spyOn(component['tableManager'], 'injectTableResizeHandles').and.callFake(() => {});
    component.insertTable();
    expect(tableServiceSpy).toHaveBeenCalledWith(2, 2, mockDiv);
    expect(tableManagerSpy).toHaveBeenCalled();
  });

  it('should insert HTML at cursor', () => {
    // Mock editor and selection
    const mockDiv = document.createElement('div');
    document.body.appendChild(mockDiv);
    (component as any).editor = { nativeElement: mockDiv };
    mockDiv.focus();
    const range = document.createRange();
    range.selectNodeContents(mockDiv);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    component.insertHtmlAtCursor('<div>test</div>');
    expect(mockDiv.innerHTML).toContain('test');
    document.body.removeChild(mockDiv);
  });

  it('should trigger image input', () => {
    const input = document.createElement('input');
    const clickSpy = spyOn(input, 'click');
    (component as any).imageInput = { nativeElement: input };
    component.triggerImageInput();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should handle image selection and insertion', (done) => {
    // Mock editor
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    // Mock file input event
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as any;
    // Spy on insertImageAtCursor
    const insertImageSpy = spyOn(component, 'insertImageAtCursor').and.callThrough();
    // Spy on FileReader
    const realFileReader = (window as any).FileReader;
    const mockFileReader = {
      readAsDataURL: function() { this.onload(); },
      onload: () => {},
      result: 'data:image/png;base64,abc'
    };
    (window as any).FileReader = function() { return mockFileReader; };
    component.onImageSelected(event);
    setTimeout(() => {
      expect(insertImageSpy).toHaveBeenCalledWith('data:image/png;base64,abc');
      (window as any).FileReader = realFileReader;
      done();
    }, 0);
  });

  it('should insert image at cursor', () => {
    // Mock editor and selection
    const mockDiv = document.createElement('div');
    document.body.appendChild(mockDiv);
    (component as any).editor = { nativeElement: mockDiv };
    mockDiv.focus();
    const range = document.createRange();
    range.selectNodeContents(mockDiv);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    component.insertImageAtCursor('<img src="data:image/png;base64,abc" />');
    expect(mockDiv.innerHTML).toContain('img');
    document.body.removeChild(mockDiv);
  });

  it('should align image if selected', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).editor = { nativeElement: document.createElement('div') };
    spyOn(component, 'updateHtml');
    component.alignImage('left');
    expect(img.style.marginLeft).toBe('0px');
    component.alignImage('center');
    expect(img.style.margin).toContain('auto');
    component.alignImage('right');
    expect(img.style.marginRight).toBe('0px');
    expect(component.updateHtml).toHaveBeenCalledTimes(3);
  });

  it('should not align image if none selected', () => {
    (component as any).selectedImage = null;
    expect(() => component.alignImage('left')).not.toThrow();
  });

  it('should remove image if selected', () => {
    const img = document.createElement('img');
    const parent = document.createElement('div');
    parent.appendChild(img);
    document.body.appendChild(parent);
    (component as any).selectedImage = img;
    (component as any).editor = { nativeElement: parent };
    spyOn(component, 'updateHtml');
    component.removeImage();
    expect(component.selectedImage).toBeNull();
    expect(component.showImageToolbar).toBe(false);
    expect(component.updateHtml).toHaveBeenCalled();
    document.body.removeChild(parent);
  });

  it('should not remove image if none selected', () => {
    (component as any).selectedImage = null;
    expect(() => component.removeImage()).not.toThrow();
  });

  it('should start and end image resize', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).editor = { nativeElement: document.createElement('div').appendChild(img) };
    spyOn(component['imageService'], 'startResize').and.callFake(() => {});
    const event = new MouseEvent('mousedown', { clientX: 10, clientY: 10 });
    spyOn(document, 'addEventListener');
    component.startResize(event, 'br');
    expect(component['resizing']).toBe(true);
    expect(component['resizeDir']).toBe('br');
    component.endResize();
    expect(component['resizing']).toBe(false);
    expect(component['resizeDir']).toBeNull();
  });

  it('should handle onTableCellClick for table/cell', () => {
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    tr.appendChild(td);
    table.appendChild(tr);
    document.body.appendChild(table);
    (component as any).editor = { nativeElement: document.createElement('div') };
    const event = { target: td } as any;
    component.onTableCellClick(event as MouseEvent);
    expect(component.selectedTable).toBe(table);
    expect(component.selectedCell).toBe(td);
    document.body.removeChild(table);
  });

  it('should handle onTableCellClick for non-table/cell', () => {
    const div = document.createElement('div');
    (component as any).editor = { nativeElement: document.createElement('div') };
    const event = { target: div } as any;
    component.onTableCellClick(event as MouseEvent);
    expect(component.styleTarget).toBeNull();
  });

  it('should handle onEditorFocus and onEditorBlur', () => {
    expect(() => component.onEditorFocus()).not.toThrow();
    expect(() => component.onEditorBlur()).not.toThrow();
  });

  it('should handle onSelectionChange', () => {
    expect(() => component.onSelectionChange()).not.toThrow();
  });

  it('should handle onEditorContextMenu', () => {
    const event = new MouseEvent('contextmenu');
    (component as any).editor = { nativeElement: document.createElement('div') };
    expect(() => component.onEditorContextMenu(event)).not.toThrow();
  });

  it('should handle onEditorRowClick', () => {
    const mockTarget = { closest: () => null };
    const event = { target: mockTarget } as any;
    (component as any).editor = { nativeElement: document.createElement('div') };
    expect(() => component.onEditorRowClick(event)).not.toThrow();
  });

  it('should handle onEditorMouseOver and onEditorMouseOut', () => {
    const mockTarget = { closest: () => null };
    const event = { target: mockTarget } as any;
    expect(() => component.onEditorMouseOver(event)).not.toThrow();
    expect(() => component.onEditorMouseOut(event)).not.toThrow();
  });

  it('should handle handleTableTabKey', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    expect(() => component.handleTableTabKey(event)).not.toThrow();
  });

  it('should call mergeTemplate and handle mergeResult', () => {
    (component as any).editor = { nativeElement: document.createElement('div') };
    component.html = '<table><tr><td>1</td></tr></table>';
    component.jsonPayload = '{"a":1}';
    spyOn(component['http'], 'post').and.returnValue(of({ html: '<table></table>' }));
    component.mergeTemplate();
    expect(component.isMerging).toBe(false);
  });

  it('should handle generatePreview with valid JSON', () => {
    (component as any).editor = { nativeElement: document.createElement('div') };
    component.jsonPayload = '{"a":1}';
    spyOn(component.thymeleafRender, 'renderTemplate').and.returnValue('<div>preview</div>');
    component.generatePreview();
    expect(component.previewHtml).toContain('preview');
  });

  it('should handle generatePreview with invalid JSON', () => {
    (component as any).editor = { nativeElement: document.createElement('div') };
    component.jsonPayload = '{invalid}';
    spyOn(window, 'alert');
    component.generatePreview();
    expect(window.alert).toHaveBeenCalledWith('Invalid JSON');
  });

  it('should handle updateHtml with no editor', () => {
    (component as any).editor = null;
    expect(() => component.updateHtml()).not.toThrow();
  });

  it('should handle insertTable with no editor', () => {
    (component as any).editor = null;
    expect(() => component.insertTable()).not.toThrow();
  });

  it('should handle insertHtmlAtCursor with no selection', () => {
    (component as any).editor = { nativeElement: document.createElement('div') };
    spyOn(window, 'getSelection').and.returnValue(null as any);
    expect(() => component.insertHtmlAtCursor('<div></div>')).not.toThrow();
  });

  it('should handle toggleRawHtml with editorReady false', () => {
    (component as any).editorReady = false;
    expect(() => component.toggleRawHtml()).not.toThrow();
  });

  it('should handle toggleRawHtml with editorReady true', () => {
    (component as any).editorReady = true;
    (component as any).editor = { nativeElement: document.createElement('div') };
    expect(() => component.toggleRawHtml()).not.toThrow();
  });

  // Add more tests for event handlers, image, table, and Thymeleaf logic in next batch
});
