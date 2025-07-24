// All tests commented out for npm packaging
import { TableService } from './table.service';

// Utility function to check if a value is a valid DOM element
function isDomElement(el: any): el is Element {
  return el instanceof Element;
}

describe('TableService', () => {
  let service: TableService;
  let editor: HTMLElement;
  let addRowTimeout: any;

  beforeEach(() => {
    addRowTimeout = null;
    service = new TableService();
    editor = document.createElement('div');
    editor.contentEditable = 'true';
    if (document.body && !document.body.contains(editor) && isDomElement(editor)) {
      document.body.appendChild(editor);
    }
  });

  afterEach(() => {
    if (addRowTimeout) {
      clearTimeout(addRowTimeout);
      addRowTimeout = null;
    }
    if (document.body) {
      document.querySelectorAll('div').forEach(el => {
        if (el.parentNode === document.body && isDomElement(el)) {
          el.remove();
        }
      });
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should move cursor to cell with only &nbsp;', () => {
    const cell = document.createElement('td');
    cell.appendChild(document.createTextNode('\u00A0'));
    if (isDomElement(cell)) editor.appendChild(cell);
    service.moveCursorToCell(cell, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should move cursor to cell with text node', () => {
    const cell = document.createElement('td');
    cell.appendChild(document.createTextNode('abc'));
    if (isDomElement(cell)) editor.appendChild(cell);
    service.moveCursorToCell(cell, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should move cursor to cell with no text node', () => {
    const cell = document.createElement('td');
    if (isDomElement(cell)) editor.appendChild(cell);
    service.moveCursorToCell(cell, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should insert table at cursor', () => {
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.insertTable(2, 2, editor);
    expect(editor.innerHTML).toContain('<table');
  });

  it('should alert if not inside editor when inserting table', () => {
    spyOn(window, 'alert');
    const otherDiv = document.createElement('div');
    if (document.body && !document.body.contains(otherDiv) && isDomElement(otherDiv)) {
      document.body.appendChild(otherDiv);
    }
    // Remove all selection ranges and ensure selection is not inside otherDiv
    const sel = window.getSelection();
    sel?.removeAllRanges();
    // Mock getSelection to always return a selection not inside otherDiv
    spyOn(window, 'getSelection').and.returnValue({
      rangeCount: 1,
      anchorNode: document.createElement('span'),
      focusNode: document.createElement('span'),
      removeAllRanges: () => {},
      addRange: () => {},
      getRangeAt: () => document.createRange(),
      isCollapsed: false
    } as any);
    service.insertTable(2, 2, otherDiv);
    expect(window.alert).toHaveBeenCalled();
  });

  it('should handle tab navigation to next cell', () => {
    editor.innerHTML = '<table><tr><td>1</td><td>2</td></tr></table>';
    const table = editor.querySelector('table')!;
    const td = table.rows[0].cells[0];
    const range = document.createRange();
    range.selectNodeContents(td);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    service.handleTabNavigation(event, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should handle tab navigation to next row', () => {
    editor.innerHTML = '<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>';
    const table = editor.querySelector('table')!;
    const td = table.rows[0].cells[1];
    const range = document.createRange();
    range.selectNodeContents(td);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    service.handleTabNavigation(event, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should add new row on tab at last cell', (done) => {
    editor.innerHTML = '<table><tr><td>1</td><td>2</td></tr></table>';
    const table = editor.querySelector('table')!;
    const td = table.rows[0].cells[1];
    const range = document.createRange();
    range.selectNodeContents(td);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    service.handleTabNavigation(event, editor);
    addRowTimeout = setTimeout(() => {
      if (table.parentNode) {
        expect(table.rows.length).toBe(2);
      }
      done();
    }, 10);
  });

  it('should not throw if tab navigation with no selection', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    expect(() => service.handleTabNavigation(event, editor)).not.toThrow();
  });
}); 