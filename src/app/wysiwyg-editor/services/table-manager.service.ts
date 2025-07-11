import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TableManagerService {
  private resizingCol = false;
  private resizeColIndex: number | null = null;
  private startColX = 0;
  private startColWidth = 0;
  private currentTable: HTMLTableElement | null = null;

  constructor() {}

  injectTableResizeHandles(editor: HTMLElement, startColResize: (e: MouseEvent, table: HTMLTableElement, colIndex: number) => void) {
    const tables = editor.querySelectorAll('table');
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
            handle.addEventListener('mousedown', (e: MouseEvent) => startColResize(e, table, i));
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
            handle.style.zIndex = '20';
            handle.style.pointerEvents = 'all';
            handle.addEventListener('mousedown', (e: MouseEvent) => startColResize(e, table, i));
            cell.style.position = 'relative';
            cell.appendChild(handle);
          }
        });
      }

      // --- NEW: Inject table height resize handle ---
      let tableHeightHandle = table.querySelector('.table-height-resize-handle');
      if (!tableHeightHandle) {
        tableHeightHandle = document.createElement('div');
        tableHeightHandle.className = 'table-height-resize-handle';
        tableHeightHandle.style.position = 'absolute';
        tableHeightHandle.style.left = '0';
        tableHeightHandle.style.right = '0';
        tableHeightHandle.style.bottom = '-6px';
        tableHeightHandle.style.height = '12px';
        tableHeightHandle.style.cursor = 'row-resize';
        tableHeightHandle.style.zIndex = '30';
        tableHeightHandle.style.background = 'rgba(0,0,0,0.1)';
        tableHeightHandle.addEventListener('mousedown', (e: MouseEvent) => this.startTableHeightResize(e, table));
        table.parentElement?.appendChild(tableHeightHandle);
        // Position handle absolutely relative to table
        table.style.position = 'relative';
      }
      // --- NEW: Inject row height resize handles ---
      (Array.from(table.rows) as HTMLTableRowElement[]).forEach((row, rowIdx) => {
        let rowHeightHandle = row.querySelector('.row-height-resize-handle') as HTMLDivElement | null;
        if (!rowHeightHandle) {
          rowHeightHandle = document.createElement('div') as HTMLDivElement;
          rowHeightHandle.className = 'row-height-resize-handle';
          rowHeightHandle.style.position = 'absolute';
          rowHeightHandle.style.left = '0';
          rowHeightHandle.style.right = '0';
          rowHeightHandle.style.bottom = '-4px';
          rowHeightHandle.style.height = '3px';
          rowHeightHandle.style.cursor = 'row-resize';
          rowHeightHandle.style.zIndex = '25';
          rowHeightHandle.style.background = 'rgba(0,0,0,0.08)';
          (rowHeightHandle as HTMLDivElement).addEventListener('mousedown', (e: MouseEvent) => this.startRowHeightResize(e, row));
          // Position handle absolutely relative to row
          (row as HTMLTableRowElement).style.position = 'relative';
          (row as HTMLTableRowElement).appendChild(rowHeightHandle);
        }
      });
    });
  }

  startColResize(e: MouseEvent, table: HTMLTableElement, colIndex: number, onMove: (e: MouseEvent) => void, onEnd: () => void) {
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
    // Set table width to its current pixel width and use fixed layout
    this.currentTable.style.width = this.currentTable.offsetWidth + 'px';
    this.currentTable.style.tableLayout = 'fixed';
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
      while (colgroup.children.length < numCols) {
        const col = document.createElement('col');
        colgroup.appendChild(col);
      }
      while (colgroup.children.length > numCols) {
        colgroup.removeChild(colgroup.lastChild!);
      }
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  }

  onColResizeMove = (e: MouseEvent) => {
    if (!this.resizingCol || this.resizeColIndex === null || !this.currentTable) return;
    const dx = e.clientX - this.startColX;
    const firstRow = this.currentTable.rows[0];
    if (firstRow && this.resizeColIndex !== null && firstRow.cells[this.resizeColIndex]) {
      const colgroup = this.currentTable.querySelector('colgroup');
      if (!colgroup) return;
      // Get current col widths
      let totalWidth = 0;
      const colWidths: number[] = [];
      for (let i = 0; i < colgroup.children.length; i++) {
        const col = colgroup.children[i] as HTMLTableColElement;
        const w = parseInt(col.style.width) || firstRow.cells[i].offsetWidth;
        colWidths.push(w);
        totalWidth += w;
      }
      // Get editor width (parent of table)
      const editor = this.currentTable.closest('.wysiwyg-content') as HTMLElement;
      const editorWidth = editor ? editor.offsetWidth : 0;
      // Calculate intended new width for the resized column
      let newWidthPx = Math.max(30, this.startColWidth + dx);
      let newTotal = totalWidth - colWidths[this.resizeColIndex] + newWidthPx;
      if (editorWidth && newTotal > editorWidth) {
        newWidthPx = colWidths[this.resizeColIndex] + (editorWidth - totalWidth);
        newWidthPx = Math.max(30, newWidthPx);
      }
      (colgroup.children[this.resizeColIndex] as HTMLTableColElement).style.width = newWidthPx + 'px';
      this.currentTable.style.tableLayout = 'fixed';
      // --- NEW: Set table height as inline style if it changes ---
      // If the table's height is not set, set it to its current pixel height
      if (!this.currentTable.style.height) {
        this.currentTable.style.height = this.currentTable.offsetHeight + 'px';
      }
      // Optionally, you could also set row heights here if you want them to persist
      // Array.from(this.currentTable.rows).forEach(row => {
      //   (row as HTMLTableRowElement).style.height = row.offsetHeight + 'px';
      // });
    }
  };

  onColResizeEnd = (onUpdate: () => void) => {
    this.resizingCol = false;
    this.resizeColIndex = null;
    // Remove logic that sets justResizedColumn
    this.currentTable = null;
    document.removeEventListener('mousemove', this.onColResizeMove);
    document.removeEventListener('mouseup', () => this.onColResizeEnd(onUpdate));
    onUpdate();
  };

  // --- NEW: Table height resize logic ---
  private resizingTableHeight = false;
  private startTableY = 0;
  private startTableHeight = 0;
  private currentHeightTable: HTMLTableElement | null = null;

  startTableHeightResize(e: MouseEvent, table: HTMLTableElement) {
    e.preventDefault();
    e.stopPropagation();
    this.resizingTableHeight = true;
    this.currentHeightTable = table;
    this.startTableY = e.clientY;
    this.startTableHeight = table.offsetHeight;
    document.addEventListener('mousemove', this.onTableHeightResizeMove);
    document.addEventListener('mouseup', this.onTableHeightResizeEnd);
  }

  onTableHeightResizeMove = (e: MouseEvent) => {
    if (!this.resizingTableHeight || !this.currentHeightTable) return;
    const dy = e.clientY - this.startTableY;
    let newHeight = Math.max(40, this.startTableHeight + dy);
    this.currentHeightTable.style.height = newHeight + 'px';
  };

  onTableHeightResizeEnd = (e: MouseEvent) => {
    this.resizingTableHeight = false;
    this.currentHeightTable = null;
    document.removeEventListener('mousemove', this.onTableHeightResizeMove);
    document.removeEventListener('mouseup', this.onTableHeightResizeEnd);
  };

  // --- NEW: Row height resize logic ---
  private resizingRowHeight = false;
  private startRowY = 0;
  private startRowHeight = 0;
  private currentHeightRow: HTMLTableRowElement | null = null;

  startRowHeightResize(e: MouseEvent, row: HTMLTableRowElement) {
    e.preventDefault();
    e.stopPropagation();
    this.resizingRowHeight = true;
    this.currentHeightRow = row;
    this.startRowY = e.clientY;
    this.startRowHeight = row.offsetHeight;
    document.addEventListener('mousemove', this.onRowHeightResizeMove);
    document.addEventListener('mouseup', this.onRowHeightResizeEnd);
  }

  onRowHeightResizeMove = (e: MouseEvent) => {
    if (!this.resizingRowHeight || !this.currentHeightRow) return;
    const dy = e.clientY - this.startRowY;
    let newHeight = Math.max(20, this.startRowHeight + dy);
    this.currentHeightRow.style.height = newHeight + 'px';
  };

  onRowHeightResizeEnd = (e: MouseEvent) => {
    this.resizingRowHeight = false;
    this.currentHeightRow = null;
    document.removeEventListener('mousemove', this.onRowHeightResizeMove);
    document.removeEventListener('mouseup', this.onRowHeightResizeEnd);
  };

  // Stubs for other table-related logic to be moved
  // ...
} 