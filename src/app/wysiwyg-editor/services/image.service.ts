import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageService {
  insertImage(editor: HTMLElement, imageUrl: string): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.collapse(false);
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '100%';
    img.style.display = 'block';
    img.style.margin = '8px 0';
    img.setAttribute('contenteditable', 'false');
    img.setAttribute('data-wysiwyg-img', '1');
    range.insertNode(img);
    // Move cursor after image
    range.setStartAfter(img);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
  }

  startResize(img: HTMLImageElement, event: MouseEvent, onResize: (width: number, height: number) => void): void {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = img.width;
    const startHeight = img.height;
    const aspect = startWidth / startHeight;
    const mouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth + (moveEvent.clientX - startX);
      let newHeight = newWidth / aspect;
      if (newWidth < 32) newWidth = 32;
      if (newHeight < 32) newHeight = 32;
      img.width = newWidth;
      img.height = newHeight;
      onResize(newWidth, newHeight);
    };
    const mouseUp = () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', mouseUp);
    };
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
  }

  // Add more image-related utilities as needed
} 