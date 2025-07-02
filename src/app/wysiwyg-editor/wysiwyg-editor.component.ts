import { Component, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, AfterViewChecked, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wysiwyg-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wysiwyg-editor.component.html',
  styleUrl: './wysiwyg-editor.component.css'
})
export class WysiwygEditorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('editor', { static: false }) editor!: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput', { static: false }) imageInput!: ElementRef<HTMLInputElement>;

  @Output() htmlChange = new EventEmitter<string>();
  html: string = '';
  showRawHtml = false;
  rawHtmlInput: string = '';
  private editorReady = false;
  private pendingHtmlUpdate = false;
  showFormattedPreview = false;
  showTableGrid = false;
  tableGridRows = 1;
  tableGridCols = 1;
  tableGridArray = Array(10).fill(0);
  private savedSelection: Range | null = null;
  private tableTabHandler: any = null;
  private editorHasFocus = false;
  showImageToolbar = false;
  imageToolbarTop = 0;
  imageToolbarLeft = 0;
  imageHandlesTop = 0;
  imageHandlesLeft = 0;
  imageHandlesWidth = 0;
  imageHandlesHeight = 0;
  selectedImage: HTMLImageElement | null = null;
  private resizing = false;
  private resizeDir: 'tl' | 'tr' | 'bl' | 'br' | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  showThymeleafDialog = false;
  thymeleafAttr = 'th:text';
  thymeleafVar = '';
  thymeleafAttrOptions = [
    'th:text', 'th:utext', 'th:if', 'th:unless', 'th:each', 'th:replace', 'th:include', 'th:with', 'th:attr'
  ];
  private savedRange: Range | null = null;
  jsonPayload = '';
  previewHtml = '';

  ngOnInit() {
    document.addEventListener('keydown', this.handleTableTabKey, true);
  }

  ngAfterViewInit() {
    this.editorReady = true;
    this.attachEditorFocusHandlers();
    this.attachTableTabHandler();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.addEventListener('click', this.onEditorClick);
    }
  }

  ngAfterViewChecked() {
    if (this.pendingHtmlUpdate && this.editor && this.editor.nativeElement) {
      // Parse the rawHtmlInput as a full HTML document and set only the <body> content
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString('<html><head></head><body>' + this.rawHtmlInput + '</body></html>', 'text/html');
        const bodyContent = doc.body ? doc.body.innerHTML : this.rawHtmlInput;
        this.editor.nativeElement.innerHTML = bodyContent;
      } catch {
        this.editor.nativeElement.innerHTML = this.rawHtmlInput;
      }
      this.onInput();
      this.pendingHtmlUpdate = false;
      this.attachEditorFocusHandlers();
      this.attachTableTabHandler();
    }
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleTableTabKey, true);
    this.detachEditorFocusHandlers();
    this.detachTableTabHandler();
    this.detachDocumentTabHandler();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.removeEventListener('click', this.onEditorClick);
    }
  }

  attachEditorFocusHandlers() {
    this.detachEditorFocusHandlers();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.addEventListener('focus', this.onEditorFocus);
      this.editor.nativeElement.addEventListener('blur', this.onEditorBlur);
    }
  }

  detachEditorFocusHandlers() {
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.removeEventListener('focus', this.onEditorFocus);
      this.editor.nativeElement.removeEventListener('blur', this.onEditorBlur);
    }
  }

  onEditorFocus = () => {
    this.editorHasFocus = true;
    this.attachDocumentTabHandler();
  };

  onEditorBlur = () => {
    this.editorHasFocus = false;
    this.detachDocumentTabHandler();
  };

  attachTableTabHandler() {
    this.detachTableTabHandler();
    if (this.editor && this.editor.nativeElement) {
      this.tableTabHandler = this.handleTableTabKey.bind(this);
      this.editor.nativeElement.addEventListener('keydown', this.tableTabHandler);
    }
  }

  detachTableTabHandler() {
    if (this.editor && this.editor.nativeElement && this.tableTabHandler) {
      this.editor.nativeElement.removeEventListener('keydown', this.tableTabHandler);
      this.tableTabHandler = null;
    }
  }

  format(command: string, value?: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    document.execCommand(command, false, value);
    this.updateHtml();
  }

  insertLink() {
    if (!this.editor || !this.editor.nativeElement) return;
    const url = prompt('Enter the link URL:', 'https://');
    if (url) {
      this.format('createLink', url);
    }
  }

  onInput() {
    if (!this.editor || !this.editor.nativeElement) return;
    this.updateHtml();
  }

  private updateHtml() {
    if (!this.editor || !this.editor.nativeElement) return;
    const bodyContent = this.editor.nativeElement.innerHTML;
    const rawHtml = `<html><body>${bodyContent}</body></html>`;
    this.html = this.formatHtml(rawHtml);
    this.htmlChange.emit(this.html);
  }

  private formatHtml(html: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Ensure <head> is present
      if (!doc.head) {
        const head = doc.createElement('head');
        doc.documentElement.insertBefore(head, doc.body);
      }
      return this.prettyPrint(doc.documentElement, 0);
    } catch (e) {
      return html;
    }
  }

  private prettyPrint(node: Node, level: number): string {
    const indent = '  '.repeat(level);
    let result = '';
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        result += indent + text + '\n';
      }
      return result;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      result += `${indent}<${el.tagName.toLowerCase()}`;
      for (const attr of Array.from(el.attributes)) {
        result += ` ${attr.name}="${attr.value}"`;
      }
      result += '>';
      if (el.childNodes.length) result += '\n';
      for (const child of Array.from(el.childNodes)) {
        result += this.prettyPrint(child, level + 1);
      }
      if (el.childNodes.length) result += indent;
      // Special handling for <br> to self-close as <br></br>
      if (el.tagName.toLowerCase() === 'br') {
        result = `${indent}<br></br>\n`;
      } else {
        result += `</${el.tagName.toLowerCase()}>\n`;
      }
      return result;
    }
    return '';
  }

  toggleRawHtml() {
    if (!this.editorReady) {
      return;
    }
    this.showRawHtml = !this.showRawHtml;
    if (this.showRawHtml) {
      // Switching to raw HTML mode: show the current HTML
      if (this.editor && this.editor.nativeElement) {
        this.rawHtmlInput = this.editor.nativeElement.innerHTML;
      }
    } else {
      // Switching back to WYSIWYG: update the editor with the <body> content from the raw HTML
      this.pendingHtmlUpdate = true;
    }
  }

  get formattedHtmlPreview(): string {
    if (this.showRawHtml) {
      return this.formatHtml('<html><head></head><body>' + this.rawHtmlInput + '</body></html>');
    } else {
      return this.formatHtml('<html><head></head><body>' + this.html + '</body></html>');
    }
  }

  insertTable() {
    if (!this.editor || !this.editor.nativeElement) return;
    const rows = parseInt(prompt('Number of rows?', '2') || '2', 10);
    const cols = parseInt(prompt('Number of columns?', '2') || '2', 10);
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;
    let table = '<table border="1" style="border-collapse:collapse;width:100%">';
    for (let r = 0; r < rows; r++) {
      table += '<tr>';
      for (let c = 0; c < cols; c++) {
        table += `<td style=\"min-width:40px;padding:4px;\">&nbsp;</td>`;
      }
      table += '</tr>';
    }
    table += '</table><br>';
    this.insertHtmlAtCursor(table);
    this.updateHtml();
  }

  insertHtmlAtCursor(html: string) {
    let sel, range;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement('div');
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        // Move the cursor after the inserted table
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }

  toggleTableGrid() {
    this.showTableGrid = !this.showTableGrid;
    this.tableGridRows = 1;
    this.tableGridCols = 1;
    if (this.showTableGrid) {
      // Save the current selection
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        this.savedSelection = sel.getRangeAt(0).cloneRange();
      }
    }
  }

  hideTableGrid() {
    this.showTableGrid = false;
  }

  setTableGrid(rows: number, cols: number) {
    this.tableGridRows = rows;
    this.tableGridCols = cols;
  }

  insertTableFromGrid(rows: number, cols: number) {
    this.showTableGrid = false;
    if (!this.editor || !this.editor.nativeElement) return;
    // Restore the saved selection
    if (this.savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedSelection);
      this.savedSelection = null;
    }
    let table = '<table border="1" style="border-collapse:collapse;width:100%">';
    for (let r = 0; r < rows; r++) {
      table += '<tr>';
      for (let c = 0; c < cols; c++) {
        table += `<td style=\"min-width:40px;padding:4px;\">&nbsp;</td>`;
      }
      table += '</tr>';
    }
    table += '</table><br>';
    this.insertHtmlAtCursor(table);
    this.updateHtml();
  }

  attachDocumentTabHandler() {
    document.addEventListener('keydown', this.handleTableTabKey, true);
  }

  detachDocumentTabHandler() {
    document.removeEventListener('keydown', this.handleTableTabKey, true);
  }

  handleTableTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    // Only process if selection is inside the editor
    if (!this.editor || !this.editor.nativeElement.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0);
    let td = range.startContainer as HTMLElement;
    while (td && td.nodeType === 3) td = td.parentElement!;
    if (!td || td.tagName !== 'TD') return;
    event.preventDefault(); // Always prevent default if in a TD
    const tr = td.parentElement;
    const table = tr?.parentElement?.parentElement;
    if (!tr || !table || tr.tagName !== 'TR' || table.tagName !== 'TABLE') return;
    const tds = Array.from(tr.children).filter(child => child.tagName === 'TD');
    const trs = Array.from(table.querySelectorAll('tr'));
    const rowIndex = trs.indexOf(tr as HTMLTableRowElement);
    const colIndex = tds.indexOf(td);
    // If not last cell in row, move to next cell
    if (colIndex < tds.length - 1) {
      const nextCell = tds[colIndex + 1];
      this.moveCursorToCell(nextCell);
      return;
    }
    // If last cell in row but not last row, move to first cell of next row
    if (rowIndex < trs.length - 1) {
      const nextRow = trs[rowIndex + 1];
      const nextCell = nextRow.querySelector('td');
      if (nextCell) {
        this.moveCursorToCell(nextCell);
      }
      return;
    }
    // If last cell of last row, add new row and move to its first cell
    const newRow = tr.cloneNode(true) as HTMLElement;
    Array.from(newRow.children).forEach(cell => (cell.innerHTML = '&nbsp;'));
    table.appendChild(newRow);
    // Update table row count attribute
    table.setAttribute('data-row-count', String(trs.length + 1));
    const firstCell = newRow.querySelector('td');
    if (firstCell) {
      setTimeout(() => {
        this.moveCursorToCell(firstCell);
        this.editor?.nativeElement.focus();
      }, 0);
    }
    this.updateHtml();
  };

  moveCursorToCell(cell: Element) {
    const sel = window.getSelection();
    if (!sel) return;
    // Place cursor inside a text node in the cell
    let textNode: Node | null = null;
    const childNodes = Array.from(cell.childNodes);
    for (const node of childNodes) {
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
    // Always focus the editor after moving the cursor
    this.editor?.nativeElement.focus();
  }

  triggerImageInput() {
    this.imageInput?.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.insertImageAtCursor(base64);
        this.updateHtml();
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again
    if (input) input.value = '';
  }

  insertImageAtCursor(base64: string) {
    const imgHtml = `<img src="${base64}" style="max-width:100%;height:auto;" />`;
    this.insertHtmlAtCursor(imgHtml);
  }

  onEditorClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      this.selectedImage = target as HTMLImageElement;
      this.showImageToolbar = true;
      // Position toolbar above the image
      const rect = target.getBoundingClientRect();
      const editorRect = this.editor.nativeElement.getBoundingClientRect();
      this.imageToolbarTop = rect.top - editorRect.top - 40;
      this.imageToolbarLeft = rect.left - editorRect.left;
      // Position resize handles over the image
      this.imageHandlesTop = rect.top - editorRect.top;
      this.imageHandlesLeft = rect.left - editorRect.left;
      this.imageHandlesWidth = rect.width;
      this.imageHandlesHeight = rect.height;
    } else {
      this.selectedImage = null;
      this.showImageToolbar = false;
    }
  };

  alignImage(alignment: 'left' | 'center' | 'right') {
    if (!this.selectedImage) return;
    if (alignment === 'left') {
      this.selectedImage.style.display = 'block';
      this.selectedImage.style.margin = '8px 0 8px 0';
      this.selectedImage.style.marginLeft = '0';
      this.selectedImage.style.marginRight = 'auto';
    } else if (alignment === 'center') {
      this.selectedImage.style.display = 'block';
      this.selectedImage.style.margin = '8px auto';
    } else if (alignment === 'right') {
      this.selectedImage.style.display = 'block';
      this.selectedImage.style.margin = '8px 0 8px auto';
      this.selectedImage.style.marginLeft = 'auto';
      this.selectedImage.style.marginRight = '0';
    }
    this.updateHtml();
  }

  removeImage() {
    if (!this.selectedImage) return;
    this.selectedImage.remove();
    this.selectedImage = null;
    this.showImageToolbar = false;
    this.updateHtml();
  }

  startResize(event: MouseEvent, dir: 'tl' | 'tr' | 'bl' | 'br') {
    event.preventDefault();
    event.stopPropagation();
    if (!this.selectedImage) return;
    this.resizing = true;
    this.resizeDir = dir;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.selectedImage.width;
    this.startHeight = this.selectedImage.height;
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.endResize);
  }

  onResize = (event: MouseEvent) => {
    if (!this.resizing || !this.selectedImage) return;
    let dx = event.clientX - this.startX;
    let dy = event.clientY - this.startY;
    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    if (this.resizeDir === 'br') {
      newWidth += dx;
      newHeight += dy;
    } else if (this.resizeDir === 'tr') {
      newWidth += dx;
      newHeight -= dy;
    } else if (this.resizeDir === 'bl') {
      newWidth -= dx;
      newHeight += dy;
    } else if (this.resizeDir === 'tl') {
      newWidth -= dx;
      newHeight -= dy;
    }
    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);
    this.selectedImage.style.width = newWidth + 'px';
    this.selectedImage.style.height = newHeight + 'px';
    // Update handles position and size
    const rect = this.selectedImage.getBoundingClientRect();
    const editorRect = this.editor.nativeElement.getBoundingClientRect();
    this.imageHandlesTop = rect.top - editorRect.top;
    this.imageHandlesLeft = rect.left - editorRect.left;
    this.imageHandlesWidth = rect.width;
    this.imageHandlesHeight = rect.height;
  };

  endResize = () => {
    if (!this.resizing) return;
    this.resizing = false;
    this.resizeDir = null;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.endResize);
    this.updateHtml();
  };

  convertToThymeleafVar() {
    if (!this.editor || !this.editor.nativeElement) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      alert('Please select some text to convert to a Thymeleaf variable.');
      return;
    }
    this.savedRange = sel.getRangeAt(0).cloneRange();
    this.thymeleafAttr = this.thymeleafAttrOptions[0];
    this.thymeleafVar = '';
    this.showThymeleafDialog = true;
  }

  confirmThymeleafDialog() {
    if (!this.savedRange || !this.thymeleafVar) {
      this.showThymeleafDialog = false;
      return;
    }
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(this.savedRange);
    const range = this.savedRange;
    const selectedText = range.toString();
    const span = document.createElement('span');
    span.setAttribute(this.thymeleafAttr, `${'${' + this.thymeleafVar + '}'}`);
    span.className = 'thymeleaf-var';
    span.textContent = selectedText;
    range.deleteContents();
    range.insertNode(span);
    if (span.parentNode) {
      range.setStartAfter(span);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    this.showThymeleafDialog = false;
    this.savedRange = null;
    this.updateHtml();
  }

  cancelThymeleafDialog() {
    this.showThymeleafDialog = false;
    this.savedRange = null;
  }

  generatePreview() {
    let data: any = {};
    try {
      data = JSON.parse(this.jsonPayload);
    } catch (e) {
      alert('Invalid JSON');
      return;
    }
    // Get the current HTML from the editor
    let html = this.editor?.nativeElement.innerHTML || '';
    // Replace Thymeleaf variables (e.g., th:text="${user.name}")
    html = html.replace(/th:text="\$\{([\w.]+)\}"[^>]*>(.*?)<\/span>/g, (match, varName, inner) => {
      const value = this.resolveJsonPath(data, varName) ?? '';
      return `>${value}</span>`;
    });
    this.previewHtml = html;
  }

  resolveJsonPath(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }
}
