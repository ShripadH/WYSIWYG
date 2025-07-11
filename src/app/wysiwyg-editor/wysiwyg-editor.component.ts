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
import { TableManagerService } from './table-manager.service';
import { WysiwygToolbarComponent } from './wysiwyg-toolbar/wysiwyg-toolbar.component';

@Component({
  selector: 'app-wysiwyg-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, TableStylePopupComponent, ThymeleafAttributeMenuComponent, WysiwygToolbarComponent],
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
  jsonPayload = '{\n  "title": "Dynamic Title",\n  "message": "This is a message from JSON!",\n  "users": [\n    { "id": 1, "name": "Alice Smith", "address": "123 Main St" },\n    { "id": 2, "name": "Bob Johnson", "address": "456 Oak Ave" },\n    { "id": 3, "name": "Charlie Brown", "address": "789 Pine Rd" }\n  ],\n  "user": {\n    "id": 101,\n    "name": "Shripad"\n  }\n}';
  previewHtml = '';
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
  mergeResult: string = '';
  isMerging: boolean = false;
  private editorSpecificClassesToRemove = ['thymeleaf-var'];
  private lastRenderedTableHtml: string = '';
  isRawHtmlExpanded = false;
  isJsonExpanded = false;

  toggleRawHtmlExpand() {
    this.isRawHtmlExpanded = !this.isRawHtmlExpanded;
  }

  toggleJsonExpand() {
    this.isJsonExpanded = !this.isJsonExpanded;
  }

  formatType: 'json' | 'html' = 'html';

  constructor(
    private editorDom: EditorDomService,
    private tableService: TableService,
    private imageService: ImageService,
    private http: HttpClient,
    private renderer: Renderer2,
    public thymeleafRender: ThymeleafRenderService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private tableManager: TableManagerService
  ) {
    console.log('WysiwygEditorComponent constructed');
  }

  ngOnInit() {
    // (reverted) No forced initialization of this.html
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    this.editorReady = true;
    this.attachEditorFocusHandlers();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.addEventListener('click', this.onEditorClick);
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
    // this.updateThymeleafHandles();
    // Use TableManagerService for table handles
    this.tableManager.injectTableResizeHandles(
      this.editor.nativeElement,
      (e, table, i) => this.tableManager.startColResize(
        e,
        table,
        i,
        this.tableManager.onColResizeMove,
        () => this.tableManager.onColResizeEnd(this.updateHtml.bind(this))
      )
    );
    document.addEventListener('selectionchange', this.onSelectionChange);
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
    if (this.editor?.nativeElement && this.wysiwygWrapper?.nativeElement) {
      this.thymeleafRender.updateThymeleafHandles(
        this.editor.nativeElement,
        this.wysiwygWrapper.nativeElement,
        this.ngZone,
        this.cdr
      );
    }
  }

  ngOnDestroy() {
    this.detachEditorFocusHandlers();
    this.detachDocumentTabHandler();
    if (this.editor && this.editor.nativeElement) {
      this.editor.nativeElement.removeEventListener('click', this.onEditorClick);
      this.editor.nativeElement.removeEventListener('click', this.onTableCellClick, true);
      this.editor.nativeElement.removeEventListener('keydown', this.handleTableTabKey);
      this.editor.nativeElement.removeEventListener('click', this.onEditorRowClick, true);
      this.editor.nativeElement.removeEventListener('contextmenu', this.onEditorContextMenu, true);
    }
    document.removeEventListener('selectionchange', this.onSelectionChange);
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
    this.tableManager.injectTableResizeHandles(
      this.editor.nativeElement,
      (e, table, i) => this.tableManager.startColResize(
        e,
        table,
        i,
        this.tableManager.onColResizeMove,
        () => this.tableManager.onColResizeEnd(this.updateHtml.bind(this))
      )
    );
    this.updateHtml();
  }

  public updateHtml() {
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
    this.tableManager.injectTableResizeHandles(
      this.editor.nativeElement,
      (e, table, i) => this.tableManager.startColResize(
        e,
        table,
        i,
        this.tableManager.onColResizeMove,
        () => this.tableManager.onColResizeEnd(this.updateHtml.bind(this))
      )
    );
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
    this.tableManager.injectTableResizeHandles(
      this.editor.nativeElement,
      (e, table, i) => this.tableManager.startColResize(
        e,
        table,
        i,
        this.tableManager.onColResizeMove,
        () => this.tableManager.onColResizeEnd(this.updateHtml.bind(this))
      )
    );
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
      this.imageToolbarTop = rect.top - editorRect.top + 20;
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

  onFontFamily(family: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editorDom.applyFontFamily(family, this.editor.nativeElement);
    this.updateHtml();
  }
  onFontColor(color: string) {
    if (!this.editor || !this.editor.nativeElement) return;
    this.editorDom.applyFontColor(color, this.editor.nativeElement);
    this.updateHtml();
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

  onSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // Only save if selection is inside the editor
    if (this.editor && this.editor.nativeElement.contains(range.commonAncestorContainer)) {
      this.thymeleafRender.savedRange = range.cloneRange();
    }
  };

  onEditorContextMenu = (event: MouseEvent) => {
    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      !sel.isCollapsed &&
      this.editor.nativeElement.contains(sel.anchorNode)
    ) {
      this.thymeleafRender.onEditorContextMenu(event, this.updateHtml.bind(this));
    } else {
      // No valid selection, do not show menu
      event.preventDefault();
      this.thymeleafRender.showThymeleafMenu = false;
      this.thymeleafRender.showThymeleafDialog = false;
      this.thymeleafRender.showThymeleafAttrDialog = false;
    }
  };

  onInsertHtml(html: string) {
    this.thymeleafRender.onInsertHtml(
      html,
      this.editor.nativeElement,
      this.wysiwygWrapper.nativeElement,
      this.ngZone,
      this.cdr,
      this.updateHtml.bind(this),
      () => this.tableManager.injectTableResizeHandles(
        this.editor.nativeElement,
        (e, table, i) => this.tableManager.startColResize(
          e, table, i,
          this.tableManager.onColResizeMove,
          () => this.tableManager.onColResizeEnd(this.updateHtml.bind(this))
        )
      )
    );
    this.insertHtmlAtCursor(html);
  }

  onEditorMouseOver = (event: MouseEvent) => {
    this.thymeleafRender.onEditorMouseOver(event, this.wysiwygWrapper.nativeElement);
  };

  onEditorMouseOut = (event: MouseEvent) => {
    this.thymeleafRender.onEditorMouseOut(event);
  };

  // Handler for clicking the edit handle
  onThymeleafEachEditHandleClick() {
    this.thymeleafRender.onThymeleafEachEditHandleClick(this.wysiwygWrapper.nativeElement);
  }

  onThymeleafEachEditHandleClickForTable(table: HTMLElement) {
    this.thymeleafRender.onThymeleafEachEditHandleClickForTable(table, this.wysiwygWrapper.nativeElement, this.cdr);
  }

  // Save edited th:each values back to the table and cells
  saveThymeleafEachEdit() {
    this.thymeleafRender.saveThymeleafEachEdit(this.updateHtml.bind(this));
  }

  onBeautifyHtml() {
    // Format only the body content, not the full HTML doc
    const formatted = this.formatHtml('<html><head></head><body>' + this.rawHtmlInput + '</body></html>');
    // Remove the outer <html>, <head>, <body> tags for textarea
    const match = formatted.match(/<body>([\s\S]*)<\/body>/i);
    this.rawHtmlInput = match ? match[1].trim() : formatted;
  }
  
  formatHtml1(html: string): string {
    let indent = 0;
    const tab = '  ';
    return html
      .replace(/>\s*</g, '><') // remove existing whitespace between tags
      .replace(/</g, '\n<')    // break before every tag
      .replace(/\n\s*\n/g, '\n') // remove multiple blank lines
      .split('\n')
      .map((line) => {
        line = line.trim();
        if (!line) return '';
  
        if (line.match(/^<\/\w/)) indent--; // closing tag, reduce indent first
  
        const result = tab.repeat(indent) + line;
  
        if (line.match(/^<\w[^>]*[^/]>/) && !line.startsWith('<!') && !line.includes('</')) {
          indent++; // open tag, increase indent
        }
  
        return result;
      })
      .join('\n')
      .trim();
  }
  
  beautifyJson(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return 'Invalid JSON';
    }
  }

  onBeautifyJson() {
    const beautified = this.beautifyJson(this.jsonPayload);
    if (beautified === 'Invalid JSON') {
      alert('Invalid JSON: Please check your syntax.');
      return;
    }
    this.jsonPayload = beautified;
  }
  


}
