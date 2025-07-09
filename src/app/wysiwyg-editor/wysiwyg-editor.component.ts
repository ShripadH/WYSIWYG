import { Component, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, AfterViewChecked, OnDestroy, OnInit, Renderer2, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorDomService } from './editor-dom.service';
import { TableService } from './table.service';
import { ImageService } from './image.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { TableStylePopupComponent } from './table-style-popup/table-style-popup.component';
import { ThymeleafAttributeMenuComponent } from './thymeleaf-attribute-menu/thymeleaf-attribute-menu.component';
import { ThymeleafRenderService } from './thymeleaf-render.service';

@Component({
  selector: 'app-wysiwyg-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, TableStylePopupComponent, ThymeleafAttributeMenuComponent],
  templateUrl: './wysiwyg-editor.component.html',
  styleUrl: './wysiwyg-editor.component.css'
})
export class WysiwygEditorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('editor', { static: false }) editor!: ElementRef<HTMLDivElement>;
  @ViewChild('wysiwygWrapper', { static: false }) wysiwygWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput', { static: false }) imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('previewTable', { static: false }) previewTable?: ElementRef<HTMLTableElement>;

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
  jsonPayload = '{\n  "title": "Dynamic Title",\n  "message": "This is a message from JSON!",\n  "users": [\n    { "id": 1, "name": "Alice Smith", "address": "123 Main St" },\n    { "id": 2, "name": "Bob Johnson", "address": "456 Oak Ave" },\n    { "id": 3, "name": "Charlie Brown", "address": "789 Pine Rd" }\n  ],\n  "user": {\n    "id": 101,\n    "name": "Shripad"\n  }\n}';
  previewHtml = '';
  private resizingCol = false;
  private resizeColIndex: number | null = null;
  private startColX = 0;
  private startColWidth = 0;
  private currentTable: HTMLTableElement | null = null;
  selectedTable: HTMLTableElement | null = null;
  tableIconTop: number = 0;
  tableIconLeft: number = 0;
  rowIconTops: number[] = [];
  rowIconLeft: number = 0;
  rowRefs: HTMLTableRowElement[] = [];
  selectedRow: HTMLTableRowElement | null = null;
  selectedRowIconTop: number = 0;
  selectedRowIconLeft: number = 0;
  rowHandleTops: number[] = [];
  rowHandleLeft: number = 0;
  selectedRowForHandle: HTMLTableRowElement | null = null;
  selectedRowHandleTop: number = 0;
  selectedRowHandleLeft: number = 0;
  styleTarget: { type: 'table' | 'row' | 'cell', ref: HTMLElement | null } | null = null;
  selectedCell: HTMLTableCellElement | null = null;
  showCellStyleIcon = false;
  cellStyleIconTop = 0;
  cellStyleIconLeft = 0;
  cellBgColor = '#ffffff';
  cellAlign = 'left';
  cellVAlign = 'top';
  thymeleafEachVar = '';
  thymeleafEachCollection = '';
  thymeleafEachFields = '';
  thymeleafEachAddHeader = false;
  thymeleafEachHeaderValues = '';
  mergeResult: string = '';
  isMerging: boolean = false;
  private editorSpecificClassesToRemove = ['thymeleaf-var'];
  private lastRenderedTableHtml: string = '';
  // Thymeleaf attribute menu state
  thymeleafMenuPosition: { x: number, y: number } | null = null;
  showThymeleafMenu = false;
  showThymeleafAttrDialog = false;
  thymeleafTargetElement: HTMLElement | null = null;
  // Add state for the th:each edit handle
  showThymeleafEachHandle: boolean = false;
  thymeleafEachHandleTop: number = 0;
  thymeleafEachHandleLeft: number = 0;
  thymeleafEachHandleTarget: HTMLElement | null = null;
  thymeleafHandles: Array<{ table: HTMLElement, top: number, left: number }> = [];

  constructor(
    private editorDom: EditorDomService,
    private tableService: TableService,
    private imageService: ImageService,
    private http: HttpClient,
    private renderer: Renderer2,
    private thymeleafRender: ThymeleafRenderService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('WysiwygEditorComponent constructed');
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    this.editorReady = true;
    this.attachEditorFocusHandlers();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.addEventListener('click', this.onEditorClick);
      this.editor.nativeElement.addEventListener('mousedown', this.onTableMousedown);
      this.editor.nativeElement.addEventListener('mouseup', this.onTableMouseup);
      this.editor.nativeElement.addEventListener('mousemove', this.onTableMousemove);
      this.editor.nativeElement.addEventListener('click', this.onTableCellClick, true);
      this.editor.nativeElement.addEventListener('keydown', this.handleTableTabKey);
      this.editor.nativeElement.addEventListener('click', this.onEditorRowClick, true);
      this.editor.nativeElement.addEventListener('contextmenu', this.onEditorContextMenu, true);
      // Focus the editor by default
      this.editor.nativeElement.focus();
    }
    if (this.wysiwygWrapper && this.wysiwygWrapper.nativeElement) {
      this.wysiwygWrapper.nativeElement.addEventListener('mouseover', this.onEditorMouseOver, true);
      this.wysiwygWrapper.nativeElement.addEventListener('mouseout', this.onEditorMouseOut, true);
    }
    // Initial handle update
    this.updateThymeleafHandles();
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
      this.injectTableResizeHandles();
      // Re-attach event listeners after DOM update
      this.editor.nativeElement.addEventListener('click', this.onTableCellClick, true);
    }
    // Render merged table HTML as real table if needed (robust DOM-based)
    if (this.previewTable && this.mergeResult && this.isTableHtml(this.mergeResult)) {
      if (this.lastRenderedTableHtml !== this.mergeResult) {
        // Parse the HTML and extract the <table>
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.mergeResult;
        const tableElem = tempDiv.querySelector('table');
        if (tableElem && this.previewTable) {
          // Remove all children from previewTable
          while (this.previewTable.nativeElement.firstChild) {
            this.renderer.removeChild(this.previewTable.nativeElement, this.previewTable.nativeElement.firstChild);
          }
          // Move all children from parsed tableElem to previewTable
          Array.from(tableElem.childNodes).forEach(node => {
            this.renderer.appendChild(this.previewTable!.nativeElement, node.cloneNode(true));
          });
          // Copy attributes (like style) from parsed tableElem to previewTable
          Array.from(tableElem.attributes).forEach(attr => {
            this.renderer.setAttribute(this.previewTable!.nativeElement, attr.name, attr.value);
          });
        }
        this.lastRenderedTableHtml = this.mergeResult;
      }
    }
    // Update handle positions after every view check (DOM might have changed)
    this.updateThymeleafHandles();
  }

  ngOnDestroy() {
    this.detachEditorFocusHandlers();
    this.detachDocumentTabHandler();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.removeEventListener('click', this.onEditorClick);
      this.editor.nativeElement.removeEventListener('mousedown', this.onTableMousedown);
      this.editor.nativeElement.removeEventListener('mouseup', this.onTableMouseup);
      this.editor.nativeElement.removeEventListener('mousemove', this.onTableMousemove);
      this.editor.nativeElement.removeEventListener('click', this.onTableCellClick, true);
      this.editor.nativeElement.removeEventListener('keydown', this.handleTableTabKey);
      this.editor.nativeElement.removeEventListener('contextmenu', this.onEditorContextMenu, true);
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
    this.injectTableResizeHandles();
    this.updateHtml();
  }

  private updateHtml() {
    if (!this.editor || !this.editor.nativeElement) return;
    const bodyContent = this.editor.nativeElement.innerHTML;
    const rawHtml = `<html><body>${bodyContent}</body></html>`;
    this.html = this.formatHtml(rawHtml);
    this.htmlChange.emit(this.html);
    // Re-attach event listeners after content update
    this.attachEditorFocusHandlers();
    this.editor.nativeElement.addEventListener('click', this.onTableCellClick, true);
    // Hide floating handles if their targets no longer exist
    if (this.selectedTable && !this.editor.nativeElement.contains(this.selectedTable)) {
      this.selectedTable = null;
      this.styleTarget = null;
    }
    if (this.selectedRowForHandle && !this.editor.nativeElement.contains(this.selectedRowForHandle)) {
      this.selectedRowForHandle = null;
    }
    if (this.selectedCell && !this.editor.nativeElement.contains(this.selectedCell)) {
      this.selectedCell = null;
      this.showCellStyleIcon = false;
    }
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
    this.tableService.insertTable(this.tableGridRows, this.tableGridCols, this.editor.nativeElement);
    this.updateHtml();
    this.injectTableResizeHandles();
  }

  insertHtmlAtCursor(html: string) {
    let sel, range;
    let insertedNodes: Node[] = [];
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        // Ensure the selection is inside the editor
        if (!this.editor.nativeElement.contains(range.startContainer)) {
          // Focus the editor and move cursor to the end
          this.editor.nativeElement.focus();
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(this.editor.nativeElement);
          newRange.collapse(false); // to end
          sel.addRange(newRange);
          range = sel.getRangeAt(0);
        }
        // STRICT: If still not inside editor, abort
        if (!this.editor.nativeElement.contains(range.startContainer)) {
          alert('Please click inside the editor before inserting content.');
          return;
        }
        range.deleteContents();
        const el = document.createElement('div');
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
          insertedNodes.push(lastNode);
        }
        range.insertNode(frag);
        // Move the cursor after the inserted table
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        // Clean up empty divs before and after the inserted block
        insertedNodes.forEach(n => {
          if (n.nodeType === 1 && (n as HTMLElement).tagName === 'DIV') {
            this.cleanUpEmptyDivsAround(n as HTMLElement);
          }
        });
        // Log the editor DOM after insertion
        if (this.editor && this.editor.nativeElement) {
          console.log('[insertHtmlAtCursor] Editor innerHTML after insertion:', this.editor.nativeElement.innerHTML);
        }
      }
    }
  }

  private cleanUpEmptyDivsAround(element: HTMLElement) {
    // Remove empty previous sibling
    let prev = element.previousElementSibling;
    if (prev && prev.tagName === 'DIV' && prev.innerHTML.trim() === '') {
      prev.parentElement?.removeChild(prev);
    }
    // Remove empty next sibling
    let next = element.nextElementSibling;
    if (next && next.tagName === 'DIV' && next.innerHTML.trim() === '') {
      next.parentElement?.removeChild(next);
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
    this.tableService.insertTable(rows, cols, this.editor.nativeElement);
    this.updateHtml();
    this.injectTableResizeHandles();
  }

  attachDocumentTabHandler() {
    document.addEventListener('keydown', this.handleTableTabKey, true);
  }

  detachDocumentTabHandler() {
    document.removeEventListener('keydown', this.handleTableTabKey, true);
  }

  handleTableTabKey = (event: KeyboardEvent) => {
    if (!this.editor || !this.editor.nativeElement) return;
    this.tableService.handleTabNavigation(event, this.editor.nativeElement);
    this.updateHtml();
  };

  moveCursorToCell(cell: Element) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.tableService.moveCursorToCell(cell, this.editor.nativeElement);
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
    if (!this.editor || !this.editor.nativeElement) return;
    this.imageService.insertImage(this.editor.nativeElement, base64);
  }

  onEditorClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target.tagName !== 'TD' &&
      !target.classList.contains('cell-style-icon') &&
      !target.closest('.cell-style-sidebar')
    ) {
      this.hideCellStyleUI();
    }
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
    this.imageService.startResize(
      this.selectedImage,
      event,
      (width, height) => {
        this.selectedImage!.style.width = width + 'px';
        this.selectedImage!.style.height = height + 'px';
        // Update handles position and size
        const rect = this.selectedImage!.getBoundingClientRect();
        const editorRect = this.editor.nativeElement.getBoundingClientRect();
        this.imageHandlesTop = rect.top - editorRect.top;
        this.imageHandlesLeft = rect.left - editorRect.left;
        this.imageHandlesWidth = rect.width;
        this.imageHandlesHeight = rect.height;
      }
    );
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

  confirmThymeleafDialog() {
    if (!this.savedRange) {
      this.showThymeleafDialog = false;
      return;
    }
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(this.savedRange);
    const range = this.savedRange;
    if (!this.thymeleafVar) {
      this.showThymeleafDialog = false;
      return;
    }
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
    // Use ThymeleafRenderService to process all th:* attributes
    this.previewHtml = this.thymeleafRender.renderTemplate(html, data);
  }

  injectTableResizeHandles() {
    if (!this.editor || !this.editor.nativeElement) return;
    const tables = this.editor.nativeElement.querySelectorAll('table');
    tables.forEach((table: any) => {
      // Add handles to the first row (header, if present)
      const firstRow = table.rows[0];
      if (firstRow) {
        Array.from(firstRow.cells).forEach((cell: any, i: number) => {
          const oldHandle = cell.querySelector('.col-resize-handle');
          if (oldHandle) oldHandle.remove();
          if (i < firstRow.cells.length - 1) {
            const handle = document.createElement('div');
            handle.className = 'col-resize-handle';
            handle.style.position = 'absolute';
            handle.style.top = '0';
            handle.style.right = '-6px';
            handle.style.width = '16px';
            handle.style.height = '100%';
            handle.style.minHeight = '24px';
            handle.style.cursor = 'col-resize';
            handle.style.zIndex = '20';
            handle.style.pointerEvents = 'all';
            handle.addEventListener('mousedown', (e: MouseEvent) => this.startColResize(e, table, i));
            cell.style.position = 'relative';
            cell.appendChild(handle);
          }
        });
      }
      // Also add handles to the first data row (first row with <td>)
      const firstDataRow = Array.from(table.rows).find((row: any) => Array.from((row as HTMLTableRowElement).cells).some((cell: any) => cell.tagName === 'TD')) as HTMLTableRowElement | undefined;
      if (firstDataRow && firstDataRow !== firstRow) {
        Array.from(firstDataRow.cells).forEach((cell: any, i: number) => {
          const oldHandle = cell.querySelector('.col-resize-handle');
          if (oldHandle) oldHandle.remove();
          if (i < firstDataRow.cells.length - 1) {
            const handle = document.createElement('div');
            handle.className = 'col-resize-handle';
            handle.style.position = 'absolute';
            handle.style.top = '0';
            handle.style.right = '-6px';
            handle.style.width = '16px';
            handle.style.height = '100%';
            handle.style.minHeight = '24px';
            handle.style.cursor = 'col-resize';
            // handle.style.background = '#e6b80088';
            // handle.style.borderLeft = '2px solid #e6b800';
            handle.style.zIndex = '20';
            handle.style.pointerEvents = 'all';
            handle.addEventListener('mousedown', (e: MouseEvent) => this.startColResize(e, table, i));
            cell.style.position = 'relative';
            cell.appendChild(handle);
          }
        });
      }
    });
  }

  startColResize(e: MouseEvent, table: HTMLTableElement, colIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    this.resizingCol = true;
    this.resizeColIndex = colIndex;
    this.currentTable = table;
    this.startColX = e.clientX;
    const firstRow = table.rows[0];
    if (firstRow && firstRow.cells[colIndex]) {
      this.startColWidth = firstRow.cells[colIndex].offsetWidth;
    }
    // Set table layout to fixed and width 100% immediately
    this.currentTable.style.tableLayout = 'fixed';
    this.currentTable.style.width = '100%';
    // Ensure <colgroup> exists and has the right number of <col>s
    let colgroup = table.querySelector('colgroup');
    const numCols = firstRow ? firstRow.cells.length : 0;
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      for (let i = 0; i < numCols; i++) {
        const col = document.createElement('col');
        colgroup.appendChild(col);
      }
      table.insertBefore(colgroup, table.firstChild);
    } else {
      // Ensure correct number of <col>s
      while (colgroup.children.length < numCols) {
        const col = document.createElement('col');
        colgroup.appendChild(col);
      }
      while (colgroup.children.length > numCols) {
        colgroup.removeChild(colgroup.lastChild!);
      }
    }
    document.addEventListener('mousemove', this.onColResizeMove);
    document.addEventListener('mouseup', this.onColResizeEnd);
  }

  onColResizeMove = (e: MouseEvent) => {
    if (!this.resizingCol || this.resizeColIndex === null || !this.currentTable) return;
    const dx = e.clientX - this.startColX;
    const firstRow = this.currentTable.rows[0];
    if (firstRow && this.resizeColIndex !== null && firstRow.cells[this.resizeColIndex]) {
      // Get table width
      const tableWidth = this.currentTable.offsetWidth;
      // Calculate new width in px
      const newWidthPx = Math.max(30, this.startColWidth + dx);
      // Calculate new width in percent
      const percent = Math.max(5, (newWidthPx / tableWidth) * 100);
      const percentStr = percent.toFixed(2) + '%';
      // Set width on <col> in <colgroup>
      const colgroup = this.currentTable.querySelector('colgroup');
      if (colgroup && colgroup.children[this.resizeColIndex]) {
        (colgroup.children[this.resizeColIndex] as HTMLTableColElement).style.width = percentStr;
      }
    }
  };

  onColResizeEnd = () => {
    this.resizingCol = false;
    this.resizeColIndex = null;
    this.currentTable = null;
    document.removeEventListener('mousemove', this.onColResizeMove);
    document.removeEventListener('mouseup', this.onColResizeEnd);
    this.updateHtml();
  };

  onTableMousedown = (e: MouseEvent) => {
    // Prevent editor blur when resizing
    if ((e.target as HTMLElement).classList.contains('col-resize-handle')) {
      e.preventDefault();
    }
  };
  onTableMouseup = (e: MouseEvent) => {};
  onTableMousemove = (e: MouseEvent) => {};

  // --- Border Customization ---
  onTableCellClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TABLE' || target.tagName === 'TD' || target.tagName === 'TH') {
      // Always anchor to the table element
      const tableElem = target.tagName === 'TABLE' ? target as HTMLTableElement : target.closest('table') as HTMLTableElement;
      // Do NOT set styleTarget here for table styles!
      if (tableElem) {
        this.selectedTable = tableElem;
        const rect = tableElem.getBoundingClientRect();
        this.tableIconTop = rect.top + window.scrollY - 20;
        this.tableIconLeft = rect.left + window.scrollX -24;

        // Gather row refs and positions
        this.rowRefs = Array.from(tableElem.querySelectorAll('tr'));
        this.rowIconTops = this.rowRefs.map(row => {
          const rowRect = row.getBoundingClientRect();
          return rowRect.top + window.scrollY + rowRect.height / 2 - 11; // center icon vertically
        });
        this.rowIconLeft = rect.left + window.scrollX - 28; // left of the table

        // For row handle overlay
        this.rowHandleTops = this.rowRefs.map(row => {
          const rowRect = row.getBoundingClientRect();
          return rowRect.top + window.scrollY + rowRect.height / 2 - 11;
        });
        this.rowHandleLeft = rect.left + window.scrollX - 28;
      }
    } else {
      this.styleTarget = null;
    }
    if (target.tagName === 'TD' || target.tagName === 'TH') {
      this.selectedCell = target as HTMLTableCellElement;
      const rect = this.selectedCell.getBoundingClientRect();
      const editorRect = this.editor.nativeElement.getBoundingClientRect();
      this.cellStyleIconTop = rect.top - editorRect.top + 37;
      this.cellStyleIconLeft = rect.left - editorRect.left + rect.width +10;
      this.showCellStyleIcon = true;
      this.cellBgColor = this.selectedCell.style.backgroundColor || '#ffffff';
      this.cellAlign = this.selectedCell.style.textAlign || 'left';
      this.cellVAlign = this.selectedCell.style.verticalAlign || 'top';
      // Set row handle for the clicked cell's row
      const row = target.closest('tr') as HTMLTableRowElement;
      if (row && this.selectedTable && this.selectedTable.contains(row)) {
        const rowRect = row.getBoundingClientRect();
        this.selectedRowForHandle = row;
        this.selectedRowHandleTop = rowRect.top + window.scrollY + rowRect.height / 2 - 11;
        this.selectedRowHandleLeft = this.selectedTable.getBoundingClientRect().left + window.scrollX - 28;
      }
    } else {
      this.hideCellStyleUI();
    }
  };

  applyCellStyles() {
    if (!this.selectedCell) return;
    this.selectedCell.style.backgroundColor = this.cellBgColor;
    this.selectedCell.style.textAlign = this.cellAlign as any;
    this.selectedCell.style.verticalAlign = this.cellVAlign as any;
    this.updateHtml();
    this.hideCellStyleUI();
  }

  closeCellStyleSidebar() {
    console.log('closeCellStyleSidebar called', this.showCellStyleIcon);
    this.hideCellStyleUI();
  }

  openCellStyleSidebar() {
    if (this.selectedCell) {
      this.styleTarget = { type: 'cell', ref: this.selectedCell };
    }
    this.showCellStyleIcon = false;
  }

  hideCellStyleUI() {
    this.showCellStyleIcon = false;
    this.selectedCell = null;
  }

  applyHeading(tag: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editor.nativeElement.focus();
    document.execCommand('formatBlock', false, tag === 'P' ? 'P' : tag);
    this.updateHtml();
  }

  applyFontSize(size: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editor.nativeElement.focus();
    // Use a span with style for font size
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
      this.updateHtml();
    }
  }

  // Toolbar event handlers
  onFormat(event: {command: string, value?: string}) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editorDom.format(event.command, event.value, this.editor.nativeElement);
    this.updateHtml();
  }

  onHeading(tag: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editorDom.applyHeading(tag, this.editor.nativeElement);
    this.updateHtml();
  }

  onFontSize(size: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editorDom.applyFontSize(size, this.editor.nativeElement);
    this.updateHtml();
  }

  onInsertLink() {
    if (!this.editor || !this.editor.nativeElement) return;
    const url = prompt('Enter the link URL:', 'https://');
    if (url) {
      this.editorDom.insertLink(this.editor.nativeElement, url);
      this.updateHtml();
    }
  }

  onCellStyleApply(styles: {bgColor: string, align: string, vAlign: string}) {
    console.log('onCellStyleApply called', styles, this.selectedCell);
    if (this.selectedCell) {
      this.selectedCell.style.backgroundColor = styles.bgColor;
      this.selectedCell.style.textAlign = styles.align;
      this.selectedCell.style.verticalAlign = styles.vAlign;
      this.updateHtml();
      console.log('Cell styles applied', this.selectedCell.style.backgroundColor, this.selectedCell.style.textAlign, this.selectedCell.style.verticalAlign);
    }
    this.closeCellStyleSidebar();
  }

  // Utility to remove editor-specific classes from HTML string
  private stripEditorSpecificClasses(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    this.editorSpecificClassesToRemove.forEach(cls => {
      div.querySelectorAll('.' + cls).forEach(el => {
        el.classList.remove(cls);
      });
    });
    return div.innerHTML;
  }

  mergeTemplate() {
    this.isMerging = true;
    let data: any = {};
    try {
      data = JSON.parse(this.jsonPayload);
    } catch (e) {
      alert('Invalid JSON data!');
      this.isMerging = false;
      return;
    }
    // Remove editor-specific classes before sending
    const cleanHtml = this.stripEditorSpecificClasses(this.editor.nativeElement.innerHTML);
    const body = {
      html: '<html><body>' + cleanHtml + '</body></html>',
      data
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('http://localhost:8080/template/merge', body, { headers, responseType: 'text' })
      .subscribe({
        next: (result: string) => {
          this.mergeResult = result;
          this.isMerging = false;
        },
        error: (err) => {
          alert('Merge failed: ' + (err?.message || err));
          this.isMerging = false;
        }
      });
  }

  isTableHtml(html: string): boolean {
    return /^\s*<table[\s>]/i.test(html);
  }

  openStylePopup(type: 'table' | 'row' | 'cell', ref: HTMLElement) {
    this.styleTarget = { type, ref };
  }

  selectRowForStyle(row: HTMLTableRowElement, top: number, left: number) {
    this.selectedRow = row;
    this.selectedRowIconTop = top;
    this.selectedRowIconLeft = left;
    this.openStylePopup('row', row);
  }

  onEditorRowClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // If a cell is clicked, do not trigger row logic
    if (target.closest('td, th')) return;
    const row = target.closest('tr') as HTMLTableRowElement;
    if (row && this.selectedTable && this.selectedTable.contains(row)) {
      const rowRect = row.getBoundingClientRect();
      this.selectRowForStyle(
        row,
        rowRect.top + window.scrollY + rowRect.height / 2 - 11,
        this.selectedTable.getBoundingClientRect().left + window.scrollX - 28
      );
      event.stopPropagation();
    } else {
      this.selectedRow = null;
    }
  };

  onApplyStyle(event: { type: 'table' | 'row' | 'cell', styles: any }) {
    console.log('onApplyStyle', event, this.styleTarget?.ref);
    if (!this.styleTarget?.ref) return;
    if (event.type === 'table') {
      const { borderColor, borderWidth, borderStyle } = event.styles;
      this.styleTarget.ref.style.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
      // Optionally apply to all cells
      const cells = this.styleTarget.ref.querySelectorAll?.('td, th');
      if (cells) {
        cells.forEach((cell: any) => {
          cell.style.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
        });
      }
    } else if (event.type === 'row') {
      // Apply top and bottom border styles to each cell in the row
      const { topBorderColor, topBorderWidth, topBorderStyle, bottomBorderColor, bottomBorderWidth, bottomBorderStyle } = event.styles;
      const cells = this.styleTarget.ref.querySelectorAll('td, th');
      if (topBorderWidth !== undefined && topBorderStyle && topBorderColor) {
        cells.forEach((cell) => {
          (cell as HTMLElement).style.borderTop = `${topBorderWidth}px ${topBorderStyle} ${topBorderColor}`;
        });
      }
      if (bottomBorderWidth !== undefined && bottomBorderStyle && bottomBorderColor) {
        cells.forEach((cell) => {
          (cell as HTMLElement).style.borderBottom = `${bottomBorderWidth}px ${bottomBorderStyle} ${bottomBorderColor}`;
        });
      }
    } else if (event.type === 'cell') {
      const { bgColor, align, vAlign } = event.styles;
      this.styleTarget.ref.style.backgroundColor = bgColor;
      this.styleTarget.ref.style.textAlign = align;
      this.styleTarget.ref.style.verticalAlign = vAlign;
    }
    this.styleTarget = null;
    this.selectedRow = null;
  }

  onEditorContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    let target = event.target as HTMLElement;
    // If the target is the editor itself or not an element, wrap selection in a span
    if (target === this.editor.nativeElement || target.nodeType !== Node.ELEMENT_NODE) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && this.editor.nativeElement.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        // SAFER: clone contents, append, delete, insert
        const frag = range.cloneContents();
        span.appendChild(frag);
        range.deleteContents();
        range.insertNode(span);
        target = span;
        // Move selection to the new span
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
        this.updateHtml();
      } else {
        // If no selection, do nothing
        return;
      }
    }
    // Always close all dialogs before opening the menu
    this.showThymeleafDialog = false;
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = true;
    this.thymeleafMenuPosition = { x: event.clientX, y: event.clientY };
    this.thymeleafTargetElement = target;
  };

  onThymeleafMenuClose() {
    this.showThymeleafMenu = false;
    this.showThymeleafAttrDialog = false;
  }

  // Save selection before opening Thymeleaf dialog/menu
  onThymeleafOpenDialog(attr: string) {
    // Save the current selection
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
      console.log('[onThymeleafOpenDialog] Saved selection range');
    }
    // Always close all dialogs before opening a new one
    this.showThymeleafDialog = false;
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = false;
    if (attr === 'th:text' || attr === 'th:utext') {
      this.showThymeleafDialog = true;
    } else {
      this.showThymeleafAttrDialog = true;
    }
    if (this.thymeleafTargetElement) {
      // Optionally, pre-fill dialog fields here
    }
  }

  onThymeleafCloseDialog() {
    this.showThymeleafAttrDialog = false;
  }

  onThymeleafAttributeChange(event: { attr: string, value: string | null }) {
    if (this.thymeleafTargetElement && event.attr) {
      if (event.value === null) {
        this.thymeleafTargetElement.removeAttribute(event.attr);
        // Remove thymeleaf-var class if no more th:text or th:utext
        if (!this.thymeleafTargetElement.hasAttribute('th:text') && !this.thymeleafTargetElement.hasAttribute('th:utext')) {
          this.thymeleafTargetElement.classList.remove('thymeleaf-var');
        }
      } else {
        this.thymeleafTargetElement.setAttribute(event.attr, event.value);
        // Add thymeleaf-var class for th:text or th:utext
        if (event.attr === 'th:text' || event.attr === 'th:utext') {
          this.thymeleafTargetElement.classList.add('thymeleaf-var');
        }
      }
    }
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = false;
    this.updateHtml();
  }

  // Call updateThymeleafHandles after any DOM change that could affect tables
  onInsertHtml(html: string) {
    // Restore the saved selection before inserting
    if (this.savedRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedRange);
      this.savedRange = null;
    }
    this.insertHtmlAtCursor(html);
    this.updateHtml();
    this.injectTableResizeHandles();
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = false;
    this.updateThymeleafHandles();
  }

  // Mouseover handler to show the edit handle for th:each tables
  onEditorMouseOver = (event: MouseEvent) => {
    let target = event.target as HTMLElement;
    // Find the closest th:each table from the event target
    let table = target.closest('table');
    while (table && !table.hasAttribute('th:each') && table.parentElement) {
      table = table.parentElement.closest('table');
    }
    if (table && table.hasAttribute('th:each')) {
      const rect = table.getBoundingClientRect();
      const wrapperRect = this.wysiwygWrapper.nativeElement.getBoundingClientRect();
      this.thymeleafEachHandleTop = rect.top - wrapperRect.top - 28; // above table
      this.thymeleafEachHandleLeft = rect.left - wrapperRect.left + 8; // left edge
      this.showThymeleafEachHandle = true;
      this.thymeleafEachHandleTarget = table as HTMLElement;
    }
  };

  // Mouseout handler to hide the edit handle only if leaving both table and handle
  onEditorMouseOut = (event: MouseEvent) => {
    const related = event.relatedTarget as HTMLElement;
    // If moving to another part of the same table or the handle, do not hide
    if (related) {
      // If still inside the same th:each table, keep handle
      let table = related.closest('table');
      while (table && !table.hasAttribute('th:each') && table.parentElement) {
        table = table.parentElement.closest('table');
      }
      if (table && this.thymeleafEachHandleTarget && table === this.thymeleafEachHandleTarget) {
        return;
      }
      // If moving to the handle itself, keep handle
      if (related.classList && related.classList.contains('thymeleaf-each-edit-handle')) {
        return;
      }
    }
    this.showThymeleafEachHandle = false;
    this.thymeleafEachHandleTarget = null;
  };

  // Handler for clicking the edit handle
  onThymeleafEachEditHandleClick() {
    if (this.thymeleafEachHandleTarget) {
      this.thymeleafMenuPosition = {
        x: this.thymeleafEachHandleLeft + 32,
        y: this.thymeleafEachHandleTop + 32
      };
      this.thymeleafTargetElement = this.thymeleafEachHandleTarget;
      // Pre-fill dialog with current th:each values
      const attr = 'th:each';
      const val = this.thymeleafEachHandleTarget.getAttribute(attr) || '';
      // Parse th:each value (e.g., student : ${students})
      const match = val.match(/(\w+)\s*:\s*\$\{(.+?)\}/);
      this.thymeleafEachVar = match ? match[1] : '';
      this.thymeleafEachCollection = match ? match[2] : '';
      // Try to extract fields from the first row/cell
      const firstRow = this.thymeleafEachHandleTarget.querySelector('tr');
      let fields = '';
      if (firstRow) {
        const tds = firstRow.querySelectorAll('td');
        fields = Array.from(tds).map(td => {
          const thText = td.getAttribute('th:text') || '';
          const fieldMatch = thText.match(/\$\{.*?\.(.*?)\}/);
          return fieldMatch ? fieldMatch[1] : '';
        }).filter(Boolean).join(',');
      }
      this.thymeleafEachFields = fields;
      // Check for header row
      const headerRow = this.thymeleafEachHandleTarget.querySelector('tr th');
      this.thymeleafEachAddHeader = !!headerRow;
      if (this.thymeleafEachAddHeader) {
        const headerVals = Array.from(this.thymeleafEachHandleTarget.querySelectorAll('tr th')).map(th => th.textContent?.trim() || '');
        this.thymeleafEachHeaderValues = headerVals.join(',');
      } else {
        this.thymeleafEachHeaderValues = '';
      }
      this.showThymeleafAttrDialog = true;
      this.showThymeleafMenu = false;
    }
  }

  onThymeleafEachEditHandleClickForTable(table: HTMLElement) {
    console.log('[onThymeleafEachEditHandleClickForTable] called for table:', table);
    // Find the first tr with th:each or data-th-each
    const tr = table.querySelector('tr[th\\:each], tr[data-th-each]') as HTMLElement | null;
    let thEachValue = '';
    if (tr) {
      thEachValue = tr.getAttribute('th:each') || tr.getAttribute('data-th-each') || '';
    }
    // Parse th:each value (e.g., student : ${students})
    const match = thEachValue.match(/(\w+)\s*:\s*\$\{(.+?)\}/);
    this.thymeleafEachVar = match ? match[1] : '';
    this.thymeleafEachCollection = match ? match[2] : '';
    // Try to extract fields from the first row/cell
    let fields = '';
    if (tr) {
      const tds = tr.querySelectorAll('td');
      fields = Array.from(tds).map(td => {
        const thText = td.getAttribute('th:text') || '';
        const fieldMatch = thText.match(/\$\{.*?\.(.*?)\}/);
        return fieldMatch ? fieldMatch[1] : '';
      }).filter(Boolean).join(',');
    }
    this.thymeleafEachFields = fields;
    // Check for header row
    const headerRow = table.querySelector('tr th');
    this.thymeleafEachAddHeader = !!headerRow;
    if (this.thymeleafEachAddHeader) {
      const headerVals = Array.from(table.querySelectorAll('tr th')).map(th => th.textContent?.trim() || '');
      this.thymeleafEachHeaderValues = headerVals.join(',');
    } else {
      this.thymeleafEachHeaderValues = '';
    }
    this.thymeleafTargetElement = table;
    this.thymeleafMenuPosition = {
      x: table.getBoundingClientRect().right - this.wysiwygWrapper.nativeElement.getBoundingClientRect().left - 16,
      y: table.getBoundingClientRect().top - this.wysiwygWrapper.nativeElement.getBoundingClientRect().top - 32
    };
    this.showThymeleafAttrDialog = true;
    this.showThymeleafMenu = false;
    console.log('[onThymeleafEachEditHandleClickForTable] showThymeleafAttrDialog:', this.showThymeleafAttrDialog);
    this.cdr.detectChanges();
    console.log('[onThymeleafEachEditHandleClickForTable] after detectChanges');
  }

  // Save edited th:each values back to the table and cells
  saveThymeleafEachEdit() {
    if (!this.thymeleafTargetElement) return;
    // Find the first tr with th:each or data-th-each
    const tr = this.thymeleafTargetElement.querySelector('tr[th\\:each], tr[data-th-each]') as HTMLElement | null;
    if (!tr) return;
    // Update th:each attribute
    tr.setAttribute('th:each', `${this.thymeleafEachVar} : \${${this.thymeleafEachCollection}}`);
    // Update fields in cells
    const fields = this.thymeleafEachFields.split(',').map(f => f.trim()).filter(f => f);
    const tds = tr.querySelectorAll('td');
    fields.forEach((field, i) => {
      if (tds[i]) {
        tds[i].setAttribute('th:text', `\${${this.thymeleafEachVar}.${field}}`);
        tds[i].textContent = `${this.thymeleafEachVar}.${field}`;
      }
    });
    this.updateHtml();
    this.injectTableResizeHandles();
    this.updateThymeleafHandles();
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = false;
  }

  updateThymeleafHandles() {
    if (!this.editor || !this.editor.nativeElement || !this.wysiwygWrapper) {
      this.thymeleafHandles = [];
      return;
    }
    // Find all tables that contain a tr with th:each or data-th-each
    const tables = Array.from(this.editor.nativeElement.querySelectorAll('table')).filter(table =>
      table.querySelector('tr[th\\:each], tr[data-th-each]')
    ) as HTMLElement[];
    const wrapperRect = this.wysiwygWrapper.nativeElement.getBoundingClientRect();
    this.thymeleafHandles = tables.map(table => {
      const rect = table.getBoundingClientRect();
      return {
        table,
        // Position at top-right of the table
        top: rect.top - wrapperRect.top - 28,
        left: rect.right - wrapperRect.left - 32 // 32px from right edge
      };
    });
    // Run change detection to update the view if needed
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.cdr.detectChanges(), 0);
    });
  }
}
