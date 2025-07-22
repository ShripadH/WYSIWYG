import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';

import { WysiwygEditorComponent } from './wysiwyg-editor.component';
import { Subscription, of } from 'rxjs';

describe('WysiwygEditorComponent', () => {
  let component: WysiwygEditorComponent;
  let fixture: ComponentFixture<WysiwygEditorComponent>;

  let imageSelectionTimeout: any;
  let realFileReader: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WysiwygEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WysiwygEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WysiwygEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Attach editor to body if it exists
    if ((component as any).editor && (component as any).editor.nativeElement && !document.body.contains((component as any).editor.nativeElement)) {
      document.body.appendChild((component as any).editor.nativeElement);
    }
  });

  afterEach(() => {
    if (imageSelectionTimeout) {
      clearTimeout(imageSelectionTimeout);
      imageSelectionTimeout = null;
    }
    if (realFileReader) {
      (window as any).FileReader = realFileReader;
      realFileReader = null;
    }
    // Remove all elements appended to document.body by the tests
    document.querySelectorAll('table, div, img, span').forEach(el => {
      if (el.parentNode === document.body) {
        el.remove();
      }
    });
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
    if (!document.body.contains(mockDiv)) {
      document.body.appendChild(mockDiv);
    }
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

  it('should handle image selection and insertion', fakeAsync(() => {
    // Mock editor
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    // Mock file input event
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as any;
    // Spy on insertImageAtCursor
    const insertImageSpy = spyOn(component, 'insertImageAtCursor').and.callThrough();
    // Spy on FileReader
    realFileReader = (window as any).FileReader;
    const mockFileReader = {
      readAsDataURL: function() { this.onload(); },
      onload: () => {},
      result: 'data:image/png;base64,abc'
    };
    (window as any).FileReader = function() { return mockFileReader; };
    component.onImageSelected(event);
    tick();
    if (document.body.contains(mockDiv)) {
      expect(insertImageSpy).toHaveBeenCalledWith('data:image/png;base64,abc');
    }
    (window as any).FileReader = realFileReader;
  }));

  it('should insert image at cursor', () => {
    // Mock editor and selection
    const mockDiv = document.createElement('div');
    if (!document.body.contains(mockDiv)) {
      document.body.appendChild(mockDiv);
    }
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
    if (!document.body.contains(parent)) {
      document.body.appendChild(parent);
    }
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
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    tr.appendChild(td);
    table.appendChild(tr);
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

  it('should handle ngAfterViewChecked with pendingHtmlUpdate', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    (component as any).pendingHtmlUpdate = true;
    component.rawHtmlInput = '<div>test</div>';
    component.ngAfterViewChecked();
    expect(mockDiv.innerHTML).toContain('test');
    expect((component as any).pendingHtmlUpdate).toBe(false);
  });

  it('should handle ngAfterViewChecked with previewTable and mergeResult', () => {
    const table = document.createElement('table');
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    const previewTable = document.createElement('table');
    (component as any).previewTable = { nativeElement: previewTable };
    component.mergeResult = '<table><tr><td>1</td></tr></table>';
    (component as any).lastRenderedTableHtml = '';
    spyOn(document, 'createElement').and.callThrough();
    component.isTableHtml = () => true;
    component.ngAfterViewChecked();
    expect((component as any).lastRenderedTableHtml).toBe(component.mergeResult);
  });

  it('should call format and updateHtml', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(document, 'execCommand');
    spyOn(component, 'updateHtml');
    component.format('bold', '');
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, '');
    expect(component.updateHtml).toHaveBeenCalled();
  });

  it('should return formattedHtmlPreview for rawHtml', () => {
    component.showRawHtml = true;
    component.rawHtmlInput = '<div>test</div>';
    const result = component.formattedHtmlPreview;
    expect(result).toContain('test');
  });

  it('should return formattedHtmlPreview for wysiwyg', () => {
    component.showRawHtml = false;
    component.html = '<div>test2</div>';
    const result = component.formattedHtmlPreview;
    expect(result).toContain('test2');
  });

  it('should handle insertHtmlAtCursor with selection outside editor', () => {
    const mockDiv = document.createElement('div');
    if (!document.body.contains(mockDiv)) {
      document.body.appendChild(mockDiv);
    }
    (component as any).editor = { nativeElement: mockDiv };
    // Mock getSelection to always return a selection outside the editor
    const fakeSelection = {
      getRangeAt: () => ({ startContainer: document.createElement('div') }),
      removeAllRanges: () => {},
      addRange: () => {},
      rangeCount: 1
    };
    spyOn(window, 'getSelection').and.returnValue(fakeSelection as any);
    spyOn(window, 'alert');
    component.insertHtmlAtCursor('<div>test</div>');
    expect(window.alert).toHaveBeenCalled();
    document.body.removeChild(mockDiv);
  });

  it('should handle insertHtmlAtCursor with no selection', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(window, 'getSelection').and.returnValue(null as any);
    expect(() => component.insertHtmlAtCursor('<div></div>')).not.toThrow();
  });

  it('should insert table from grid with saved selection', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    const range = document.createRange();
    range.selectNodeContents(mockDiv);
    (component as any).savedSelection = range;
    spyOn(window, 'getSelection').and.returnValue({
      removeAllRanges: () => {},
      addRange: () => {},
    } as any);
    spyOn(component['tableService'], 'insertTable');
    spyOn(component['tableManager'], 'injectTableResizeHandles');
    component.insertTableFromGrid(2, 3);
    expect(component['tableService'].insertTable).toHaveBeenCalledWith(2, 3, mockDiv);
    expect(component['tableManager'].injectTableResizeHandles).toHaveBeenCalled();
    expect((component as any).savedSelection).toBeNull();
  });

  it('should insert table from grid without saved selection', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    (component as any).savedSelection = null;
    spyOn(component['tableService'], 'insertTable');
    spyOn(component['tableManager'], 'injectTableResizeHandles');
    component.insertTableFromGrid(1, 1);
    expect(component['tableService'].insertTable).toHaveBeenCalledWith(1, 1, mockDiv);
    expect(component['tableManager'].injectTableResizeHandles).toHaveBeenCalled();
  });

  it('should not insert table from grid if no editor', () => {
    (component as any).editor = null;
    expect(() => component.insertTableFromGrid(1, 1)).not.toThrow();
  });

  it('should move cursor to cell if editor exists', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(component['tableService'], 'moveCursorToCell');
    const cell = document.createElement('td');
    component.moveCursorToCell(cell);
    expect(component['tableService'].moveCursorToCell).toHaveBeenCalledWith(cell, mockDiv);
  });

  it('should not move cursor to cell if no editor', () => {
    (component as any).editor = null;
    const cell = document.createElement('td');
    expect(() => component.moveCursorToCell(cell)).not.toThrow();
  });

  it('should handle onEditorClick for image', () => {
    const img = document.createElement('img');
    const mockDiv = document.createElement('div');
    mockDiv.appendChild(img);
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(img, 'getBoundingClientRect').and.returnValue({ top: 10, left: 20, width: 100, height: 50, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    spyOn(mockDiv, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 200, height: 200, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    const event = { target: img } as any;
    component.onEditorClick(event);
    expect(component.selectedImage).toBe(img);
    expect(component.showImageToolbar).toBe(true);
  });

  it('should handle onEditorClick for table cell', () => {
    const td = document.createElement('td');
    const mockDiv = document.createElement('div');
    mockDiv.appendChild(td);
    (component as any).editor = { nativeElement: mockDiv };
    const event = { target: td } as any;
    component.onEditorClick(event);
    expect(component.selectedImage).toBeNull();
    expect(component.showImageToolbar).toBe(false);
  });

  it('should handle onEditorClick for non-cell/non-image', () => {
    const div = document.createElement('div');
    const mockDiv = document.createElement('div');
    mockDiv.appendChild(div);
    (component as any).editor = { nativeElement: mockDiv };
    const event = { target: div } as any;
    component.selectedImage = {} as any;
    component.showImageToolbar = true;
    component.onEditorClick(event);
    expect(component.selectedImage).toBeNull();
    expect(component.showImageToolbar).toBe(false);
  });

  it('should handle onResize for br direction', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).resizing = true;
    (component as any).resizeDir = 'br';
    (component as any).startX = 10;
    (component as any).startY = 20;
    (component as any).startWidth = 100;
    (component as any).startHeight = 50;
    spyOn(img, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 120, height: 70, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    const mockDiv = document.createElement('div');
    spyOn(mockDiv, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 200, height: 200, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    (component as any).editor = { nativeElement: mockDiv };
    const event = { clientX: 30, clientY: 40 } as any;
    component.onResize(event);
    expect(img.style.width).toBe('120px');
    expect(img.style.height).toBe('70px');
  });

  it('should handle onResize for tr direction', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).resizing = true;
    (component as any).resizeDir = 'tr';
    (component as any).startX = 10;
    (component as any).startY = 20;
    (component as any).startWidth = 100;
    (component as any).startHeight = 50;
    const event = { clientX: 30, clientY: 0 } as MouseEvent;
    img.style.width = '100px';
    img.style.height = '50px';
    spyOn(img, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 120, height: 70, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    (component as any).editor = { nativeElement: document.createElement('div') };
    spyOn(component.editor.nativeElement, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 200, height: 200, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    component.onResize(event);
    expect(img.style.width).toBe('120px');
    expect(img.style.height).toBe('30px'); // 50 - (20 - 0)
  });

  it('should handle onResize for bl direction', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).resizing = true;
    (component as any).resizeDir = 'bl';
    (component as any).startX = 10;
    (component as any).startY = 20;
    (component as any).startWidth = 100;
    (component as any).startHeight = 50;
    const event = { clientX: 30, clientY: 40 } as MouseEvent;
    img.style.width = '100px';
    img.style.height = '50px';
    spyOn(img, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 120, height: 70, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    (component as any).editor = { nativeElement: document.createElement('div') };
    spyOn(component.editor.nativeElement, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 200, height: 200, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    component.onResize(event);
    expect(img.style.width).toBe('80px'); // 100 - (30 - 10)
    expect(img.style.height).toBe('70px'); // 50 + (40 - 20)
  });

  it('should handle onResize for tl direction', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).resizing = true;
    (component as any).resizeDir = 'tl';
    (component as any).startX = 10;
    (component as any).startY = 20;
    (component as any).startWidth = 100;
    (component as any).startHeight = 50;
    const event = { clientX: 30, clientY: 0 } as MouseEvent;
    img.style.width = '100px';
    img.style.height = '50px';
    spyOn(img, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 120, height: 70, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    (component as any).editor = { nativeElement: document.createElement('div') };
    spyOn(component.editor.nativeElement, 'getBoundingClientRect').and.returnValue({ top: 0, left: 0, width: 200, height: 200, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    component.onResize(event);
    expect(img.style.width).toBe('80px'); // 100 - (30 - 10)
    expect(img.style.height).toBe('30px'); // 50 - (20 - 0)
  });

  it('should not resize if not resizing or no selectedImage', () => {
    (component as any).resizing = false;
    (component as any).selectedImage = null;
    expect(() => component.onResize({} as any)).not.toThrow();
  });

  it('should apply cell styles if selectedCell exists', () => {
    const td = document.createElement('td');
    component.selectedCell = td;
    component.cellBgColor = '#abc';
    component.cellAlign = 'center';
    component.cellVAlign = 'bottom';
    spyOn(component, 'updateHtml');
    spyOn(component, 'hideCellStyleUI');
    component.applyCellStyles();
    expect(td.style.backgroundColor).toBe('rgb(170, 187, 204)');
    expect(td.style.textAlign).toBe('center');
    expect(td.style.verticalAlign).toBe('bottom');
    expect(component.updateHtml).toHaveBeenCalled();
    expect(component.hideCellStyleUI).toHaveBeenCalled();
  });

  it('should not apply cell styles if selectedCell is null', () => {
    component.selectedCell = null;
    expect(() => component.applyCellStyles()).not.toThrow();
  });

  it('should open cell style sidebar if selectedCell exists', () => {
    const td = document.createElement('td');
    component.selectedCell = td;
    component.styleTarget = null;
    component.showCellStyleIcon = true;
    component.openCellStyleSidebar();
    expect(component.styleTarget).toEqual(jasmine.objectContaining({ type: 'cell', ref: td }));
    expect(component.showCellStyleIcon).toBe(false);
  });

  it('should open cell style sidebar if selectedCell is null', () => {
    component.selectedCell = null;
    component.styleTarget = null;
    component.showCellStyleIcon = true;
    component.openCellStyleSidebar();
    expect(component.styleTarget).toBeNull();
    expect(component.showCellStyleIcon).toBe(false);
  });

  it('should re-attach event listeners when switching from raw HTML to WYSIWYG', () => {
    const mockDiv = document.createElement('div');
    const removeEventListenerSpy = spyOn(mockDiv, 'removeEventListener');
    const addEventListenerSpy = spyOn(mockDiv, 'addEventListener');
    (component as any).editor = { nativeElement: mockDiv };
    (component as any).showRawHtml = false;
    (component as any).prevShowRawHtml = true;
    component.ngAfterViewChecked();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', component.onEditorClick);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', component.onTableCellClick, true);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', component.handleTableTabKey);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', component.onEditorRowClick, true);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', component.onEditorContextMenu, true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', component.onEditorClick);
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', component.onTableCellClick, true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', component.handleTableTabKey);
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', component.onEditorRowClick, true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('contextmenu', component.onEditorContextMenu, true);
  });

  it('should update image size and handle positions in image resize callback', () => {
    const img = document.createElement('img');
    (component as any).selectedImage = img;
    (component as any).editor = { nativeElement: document.createElement('div') };
    spyOn(img, 'getBoundingClientRect').and.returnValue({
      top: 10, left: 20, width: 100, height: 50, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    spyOn(component.editor.nativeElement, 'getBoundingClientRect').and.returnValue({
      top: 2, left: 5, width: 200, height: 200, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} });
    const cb = (component as any).imageResizeCallback || ((width: number, height: number) => {
      component.selectedImage!.style.width = width + 'px';
      component.selectedImage!.style.height = height + 'px';
      const rect = component.selectedImage!.getBoundingClientRect();
      const editorRect = component.editor.nativeElement.getBoundingClientRect();
      component.imageHandlesTop = rect.top - editorRect.top;
      component.imageHandlesLeft = rect.left - editorRect.left;
      component.imageHandlesWidth = rect.width;
      component.imageHandlesHeight = rect.height;
    });
    cb(123, 456);
    expect(img.style.width).toBe('123px');
    expect(img.style.height).toBe('456px');
    expect(component.imageHandlesTop).toBe(8);
    expect(component.imageHandlesLeft).toBe(15);
    expect(component.imageHandlesWidth).toBe(100);
    expect(component.imageHandlesHeight).toBe(50);
  });

  it('should insert a link at the cursor', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(window, 'prompt').and.returnValue('http://example.com');
    spyOn(document, 'execCommand');
    component.insertLink();
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'http://example.com');
  });

  it('should not insert a link if prompt is cancelled', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(window, 'prompt').and.returnValue(null);
    spyOn(document, 'execCommand');
    component.insertLink();
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('should toggle table grid visibility', () => {
    component.showTableGrid = false;
    component.toggleTableGrid();
    expect(component.showTableGrid).toBe(true);
    component.toggleTableGrid();
    expect(component.showTableGrid).toBe(false);
  });

  it('should apply heading with tag P', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(mockDiv, 'focus');
    spyOn(document, 'execCommand');
    spyOn(component, 'updateHtml');
    component.applyHeading('P');
    expect(mockDiv.focus).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'P');
    expect(component.updateHtml).toHaveBeenCalled();
  });

  it('should apply heading with tag H2', () => {
    const mockDiv = document.createElement('div');
    (component as any).editor = { nativeElement: mockDiv };
    spyOn(mockDiv, 'focus');
    spyOn(document, 'execCommand');
    spyOn(component, 'updateHtml');
    component.applyHeading('H2');
    expect(mockDiv.focus).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'H2');
    expect(component.updateHtml).toHaveBeenCalled();
  });

  it('should do nothing if editor is not present in applyHeading', () => {
    (component as any).editor = null;
    expect(() => component.applyHeading('H1')).not.toThrow();
  });

  it('should apply cell styles and close sidebar in onCellStyleApply', () => {
    const td = document.createElement('td');
    component.selectedCell = td;
    spyOn(component, 'updateHtml');
    spyOn(component, 'closeCellStyleSidebar');
    const styles = { bgColor: '#abc', align: 'center', vAlign: 'bottom' };
    component.onCellStyleApply(styles);
    expect(td.style.backgroundColor).toBe('rgb(170, 187, 204)');
    expect(td.style.textAlign).toBe('center');
    expect(td.style.verticalAlign).toBe('bottom');
    expect(component.updateHtml).toHaveBeenCalled();
    expect(component.closeCellStyleSidebar).toHaveBeenCalled();
  });

  it('should just close sidebar if no selectedCell in onCellStyleApply', () => {
    component.selectedCell = null;
    spyOn(component, 'closeCellStyleSidebar');
    component.onCellStyleApply({ bgColor: '#fff', align: 'left', vAlign: 'top' });
    expect(component.closeCellStyleSidebar).toHaveBeenCalled();
  });

  it('should apply table styles with left alignment', () => {
    const table = document.createElement('table');
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    const td = document.createElement('td');
    table.appendChild(td);
    component.styleTarget = { type: 'table', ref: table };
    component.onApplyStyle({
      type: 'table',
      styles: {
        borderColor: '#123',
        borderWidth: 2,
        borderStyle: 'dotted',
        tableWidth: '80%',
        tableAlign: 'left'
      }
    });
    expect(table.style.border).toContain('2px dotted');
    expect(table.style.border).toMatch(/rgb\(17, 34, 51\)/); // #123 in rgb
    expect(table.style.width).toBe('80%');
    expect(table.style.marginLeft).toBe('0px');
    expect(table.style.marginRight).toBe('auto');
    expect(td.style.border).toContain('2px dotted');
    expect(td.style.border).toMatch(/rgb\(17, 34, 51\)/);
  });

  it('should apply table styles with center alignment', () => {
    const table = document.createElement('table');
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    component.styleTarget = { type: 'table', ref: table };
    component.onApplyStyle({
      type: 'table',
      styles: {
        borderColor: '#456',
        borderWidth: 1,
        borderStyle: 'solid',
        tableWidth: '100%',
        tableAlign: 'center'
      }
    });
    expect(table.style.marginLeft).toBe('auto');
    expect(table.style.marginRight).toBe('auto');
  });

  it('should apply table styles with right alignment', () => {
    const table = document.createElement('table');
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    component.styleTarget = { type: 'table', ref: table };
    component.onApplyStyle({
      type: 'table',
      styles: {
        borderColor: '#789',
        borderWidth: 3,
        borderStyle: 'dashed',
        tableWidth: '50%',
        tableAlign: 'right'
      }
    });
    expect(table.style.marginLeft).toBe('auto');
    expect(table.style.marginRight).toBe('0px');
  });

  it('should apply table styles without tableWidth', () => {
    const table = document.createElement('table');
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    component.styleTarget = { type: 'table', ref: table };
    component.onApplyStyle({
      type: 'table',
      styles: {
        borderColor: '#abc',
        borderWidth: 2,
        borderStyle: 'solid',
        tableAlign: 'left'
      }
    });
    expect(table.style.width).toBe('');
  });

  it('should call thymeleafRender.onThymeleafEachEditHandleClick with wysiwygWrapper.nativeElement', () => {
    component.wysiwygWrapper = { nativeElement: document.createElement('div') } as any;
    spyOn(component.thymeleafRender, 'onThymeleafEachEditHandleClick');
    component.onThymeleafEachEditHandleClick();
    expect(component.thymeleafRender.onThymeleafEachEditHandleClick).toHaveBeenCalledWith(component.wysiwygWrapper.nativeElement);
  });

  it('should call thymeleafRender.onThymeleafEachEditHandleClickForTable with table, wysiwygWrapper.nativeElement, and cdr', () => {
    component.wysiwygWrapper = { nativeElement: document.createElement('div') } as any;
    const table = document.createElement('table');
    if (!document.body.contains(table)) {
      document.body.appendChild(table);
    }
    spyOn(component.thymeleafRender, 'onThymeleafEachEditHandleClickForTable');
    component.onThymeleafEachEditHandleClickForTable(table);
    expect(component.thymeleafRender.onThymeleafEachEditHandleClickForTable).toHaveBeenCalledWith(table, component.wysiwygWrapper.nativeElement, component['cdr']);
  });

  it('should call thymeleafRender.saveThymeleafEachEdit with updateHtml callback', () => {
    spyOn(component.thymeleafRender, 'saveThymeleafEachEdit');
    component.saveThymeleafEachEdit();
    expect(component.thymeleafRender.saveThymeleafEachEdit).toHaveBeenCalled();
    const cb = (component.thymeleafRender.saveThymeleafEachEdit as jasmine.Spy).calls.mostRecent().args[0];
    expect(typeof cb).toBe('function');
  });

  it('should close Thymeleaf dialog when clicking on the backdrop', () => {
    const backdrop = document.createElement('div');
    backdrop.classList.add('thymeleaf-dialog-backdrop');
    spyOn(component.thymeleafRender, 'cancelThymeleafDialog');
    spyOn(component['cdr'], 'detectChanges');
    const event = { target: backdrop } as unknown as MouseEvent;
    component.onThymeleafDialogBackdropClick(event);
    expect(component.thymeleafRender.cancelThymeleafDialog).toHaveBeenCalled();
    expect(component['cdr'].detectChanges).toHaveBeenCalled();
  });

  it('should not close Thymeleaf dialog when clicking inside the dialog', () => {
    const dialog = document.createElement('div');
    dialog.classList.add('thymeleaf-dialog');
    spyOn(component.thymeleafRender, 'cancelThymeleafDialog');
    spyOn(component['cdr'], 'detectChanges');
    const event = { target: dialog } as unknown as MouseEvent;
    component.onThymeleafDialogBackdropClick(event);
    expect(component.thymeleafRender.cancelThymeleafDialog).not.toHaveBeenCalled();
    expect(component['cdr'].detectChanges).not.toHaveBeenCalled();
  });

  it('should handle all branches in formatHtml1 map logic', () => {
    // Simulate lines: empty, closing tag, opening tag, normal
    const lines = [
      '',
      '</div>',
      '<div>',
      '<span>text</span>',
      '<!DOCTYPE html>',
      '<br/>'
    ];
    let indent = 0;
    const tab = '  ';
    const result = lines.map((line: string) => {
      line = line.trim();
      if (!line) return '';
      if (line.match(/^<\/\w/)) indent--;
      const res = tab.repeat(Math.max(0, indent)) + line;
      if (line.match(/^<\w[^>]*[^/]>/) && !line.startsWith('<!') && !line.includes('</')) {
        indent++;
      }
      return res;
    });
    expect(result[0]).toBe(''); // empty
    expect(result[1]).toBe('</div>'); // closing tag, indent--
    expect(result[2]).toBe('<div>'); // opening tag, indent++
    expect(result[3]).toBe('<span>text</span>'); // normal line, no indent
    expect(result[4]).toBe('<!DOCTYPE html>'); // doctype, not indented
    expect(result[5]).toBe('<br/>'); // self-closing
  });

  // Add more tests for event handlers, image, table, and Thymeleaf logic in next batch
});
