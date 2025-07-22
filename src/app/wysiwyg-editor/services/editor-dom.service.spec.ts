import { EditorDomService } from './editor-dom.service';

describe('EditorDomService', () => {
  let service: EditorDomService;
  let editor: HTMLElement;

  beforeEach(() => {
    service = new EditorDomService();
    editor = document.createElement('div');
    editor.contentEditable = 'true';
    if (!document.body.contains(editor)) {
      document.body.appendChild(editor);
    }
  });

  afterEach(() => {
    document.querySelectorAll('div, span').forEach(el => {
      if (el.parentNode === document.body) {
        el.remove();
      }
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should move cursor to cell with only &nbsp;', () => {
    const cell = document.createElement('td');
    cell.appendChild(document.createTextNode('\u00A0'));
    editor.appendChild(cell);
    service.moveCursorToCell(cell, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should move cursor to cell with text node', () => {
    const cell = document.createElement('td');
    cell.appendChild(document.createTextNode('abc'));
    editor.appendChild(cell);
    service.moveCursorToCell(cell, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should move cursor to cell with no text node', () => {
    const cell = document.createElement('td');
    editor.appendChild(cell);
    service.moveCursorToCell(cell, editor);
    expect(window.getSelection()?.rangeCount).toBeGreaterThan(0);
  });

  it('should apply font size to selection', () => {
    editor.innerHTML = 'hello';
    const range = document.createRange();
    range.selectNodeContents(editor.firstChild!);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontSize('18px', editor);
    expect(editor.innerHTML).toContain('font-size: 18px');
  });

  it('should apply heading', () => {
    spyOn(document, 'execCommand');
    service.applyHeading('H2', editor);
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'H2');
  });

  it('should apply heading with tag P', () => {
    spyOn(document, 'execCommand');
    service.applyHeading('P', editor);
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'P');
  });

  it('should insert link', () => {
    spyOn(document, 'execCommand');
    service.insertLink(editor, 'http://test.com');
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'http://test.com');
  });

  it('should format command', () => {
    spyOn(document, 'execCommand');
    service.format('bold', undefined, editor);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('should apply font family to selection', () => {
    editor.innerHTML = '<span>hello</span>';
    const span = editor.querySelector('span')!;
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontFamily('Arial', editor);
    expect(span.style.fontFamily).toBe('Arial');
  });

  it('should apply font family to single text node selection', () => {
    const span = document.createElement('span');
    const text = document.createTextNode('hello');
    span.appendChild(text);
    editor.appendChild(span);
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontFamily('Courier', editor);
    expect(span.style.fontFamily).toBe('Courier');
  });

  it('should apply font color to selection', () => {
    editor.innerHTML = '<span>hello</span>';
    const span = editor.querySelector('span')!;
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontColor('red', editor);
    expect(span.style.color).toBe('red');
  });

  it('should apply font color to single text node selection', () => {
    const span = document.createElement('span');
    const text = document.createTextNode('hello');
    span.appendChild(text);
    editor.appendChild(span);
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontColor('blue', editor);
    expect(span.style.color).toBe('blue');
  });

  it('should apply font family to multiple elements selection', () => {
    const span1 = document.createElement('span');
    span1.textContent = 'foo';
    const span2 = document.createElement('span');
    span2.textContent = 'bar';
    editor.appendChild(span1);
    editor.appendChild(span2);
    if (!document.body.contains(editor)) {
      document.body.appendChild(editor);
    }
    const range = document.createRange();
    range.setStart(span1.firstChild!, 0);
    range.setEnd(span2.firstChild!, 3);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontFamily('Verdana', editor);
    expect(span1.style.fontFamily).toBe('Verdana');
    expect(span2.style.fontFamily).toBe('Verdana');
  });

  it('should apply font color to multiple elements selection', () => {
    const span1 = document.createElement('span');
    span1.textContent = 'foo';
    const span2 = document.createElement('span');
    span2.textContent = 'bar';
    editor.appendChild(span1);
    editor.appendChild(span2);
    if (!document.body.contains(editor)) {
      document.body.appendChild(editor);
    }
    const range = document.createRange();
    range.setStart(span1.firstChild!, 0);
    range.setEnd(span2.firstChild!, 3);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.applyFontColor('green', editor);
    expect(span1.style.color).toBe('green');
    expect(span2.style.color).toBe('green');
  });

  it('should not throw if no selection for font family', () => {
    expect(() => service.applyFontFamily('Arial', editor)).not.toThrow();
  });

  it('should not throw if no selection for font color', () => {
    expect(() => service.applyFontColor('red', editor)).not.toThrow();
  });

  it('should skip non-HTMLElement nodes in treeWalker for font family', () => {
    const text = document.createTextNode('text');
    editor.appendChild(text);
    if (!document.body.contains(editor)) {
      document.body.appendChild(editor);
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // Should not throw
    expect(() => service.applyFontFamily('Arial', editor)).not.toThrow();
  });

  it('should skip non-HTMLElement nodes in treeWalker for font color', () => {
    const text = document.createTextNode('text');
    editor.appendChild(text);
    if (!document.body.contains(editor)) {
      document.body.appendChild(editor);
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // Should not throw
    expect(() => service.applyFontColor('red', editor)).not.toThrow();
  });
}); 