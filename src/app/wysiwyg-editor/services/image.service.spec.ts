// All tests commented out for npm packaging
import { ImageService } from './image.service';

// Utility function to check if a value is a valid DOM element
function isDomElement(el: any): el is Element {
  return el instanceof Element;
}

describe('ImageService', () => {
  let service: ImageService;
  let editor: HTMLElement;

  beforeEach(() => {
    service = new ImageService();
    editor = document.createElement('div');
    editor.contentEditable = 'true';
    if (document.body && !document.body.contains(editor) && isDomElement(editor)) {
      document.body.appendChild(editor);
    }
  });

  afterEach(() => {
    if (document.body) {
      document.querySelectorAll('div, img').forEach(el => {
        if (el.parentNode === document.body && isDomElement(el)) {
          el.remove();
        }
      });
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should insert image at cursor', () => {
    const range = document.createRange();
    editor.innerHTML = 'test';
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    service.insertImage(editor, 'http://test.com/img.png');
    expect(editor.querySelector('img')).toBeTruthy();
    expect(editor.querySelector('img')?.src).toContain('http://test.com/img.png');
  });

  it('should not throw if no selection for insertImage', () => {
    expect(() => service.insertImage(editor, 'http://test.com/img.png')).not.toThrow();
  });

  it('should start and handle image resize', () => {
    const img = document.createElement('img');
    img.width = 100;
    img.height = 50;
    if (document.body && !document.body.contains(img) && isDomElement(img)) {
      document.body.appendChild(img);
    }
    const onResize = jasmine.createSpy('onResize');
    // Simulate mousedown
    const downEvent = new MouseEvent('mousedown', { clientX: 10, clientY: 10 });
    service.startResize(img, downEvent, onResize);
    // Simulate mousemove
    const moveEvent = new MouseEvent('mousemove', { clientX: 30, clientY: 10 });
    window.dispatchEvent(moveEvent);
    expect(img.width).toBeGreaterThan(100);
    expect(img.height).toBeGreaterThan(50);
    expect(onResize).toHaveBeenCalled();
    // Simulate mouseup
    const upEvent = new MouseEvent('mouseup');
    window.dispatchEvent(upEvent);
  });
}); 