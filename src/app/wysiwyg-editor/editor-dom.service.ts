import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EditorDomService {
  moveCursorToCell(cell: Element, editor: HTMLElement): void {
    const sel = window.getSelection();
    if (!sel) return;
    // If the cell only contains &nbsp;, place the caret after it
    if (
      cell.childNodes.length === 1 &&
      cell.firstChild?.nodeType === Node.TEXT_NODE &&
      cell.textContent === '\u00A0'
    ) {
      const range = document.createRange();
      range.setStart(cell.firstChild, 1);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.focus();
      return;
    }
    // Otherwise, place cursor inside a text node in the cell
    let textNode: Node | null = null;
    for (const node of Array.from(cell.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNode = node;
        break;
      }
    }
    if (!textNode) {
      textNode = document.createTextNode('');
      cell.appendChild(textNode);
    }
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
  }

  applyFontSize(size: string, editor: HTMLElement): void {
    editor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      // Move cursor after the span
      range.setStartAfter(span);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  applyHeading(tag: string, editor: HTMLElement): void {
    editor.focus();
    document.execCommand('formatBlock', false, tag === 'P' ? 'P' : tag);
  }

  insertLink(editor: HTMLElement, url: string): void {
    editor.focus();
    document.execCommand('createLink', false, url);
  }

  format(command: string, value: string | undefined, editor: HTMLElement): void {
    editor.focus();
    document.execCommand(command, false, value);
  }
} 