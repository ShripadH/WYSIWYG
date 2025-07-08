import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TableService {
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

  insertTable(rows: number, cols: number, editor: HTMLElement): void {
    // Add colgroup with equal width cols
    let colgroup = '<colgroup>';
    const colWidth = (100 / cols).toFixed(2) + '%';
    for (let c = 0; c < cols; c++) {
      colgroup += `<col style=\"width:${colWidth};\">`;
    }
    colgroup += '</colgroup>';
    let table = `<table border=\"1\" style=\"border-collapse:collapse;width:100%\">${colgroup}`;
    for (let r = 0; r < rows; r++) {
      table += '<tr>';
      for (let c = 0; c < cols; c++) {
        table += `<td style=\"min-width:40px;padding:4px;\">&nbsp;</td>`;
      }
      table += '</tr>';
    }
    table += '</table><br>';
    // Insert at cursor
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = table;
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

  handleTabNavigation(event: KeyboardEvent, editor: HTMLElement): void {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    event.stopPropagation();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!editor.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0);
    let td = range.startContainer as HTMLElement;
    while (td && td.nodeType === 3) td = td.parentElement!;
    if (!td || td.tagName !== 'TD') return;
    const tr = td.parentElement as HTMLTableRowElement;
    const table = tr?.parentElement?.parentElement as HTMLTableElement;
    if (!tr || !table || tr.tagName !== 'TR' || table.tagName !== 'TABLE') return;
    const colIndex = (td as HTMLTableCellElement).cellIndex;
    const rowIndex = Array.prototype.indexOf.call(table.rows, tr);
    // If not last cell in row, move to next cell
    if (colIndex < tr.cells.length - 1) {
      const nextCell = tr.cells[colIndex + 1];
      this.moveCursorToCell(nextCell, editor);
      return;
    }
    // If last cell in row but not last row, move to first cell of next row
    if (rowIndex < table.rows.length - 1) {
      const nextRow = table.rows[rowIndex + 1] as HTMLTableRowElement;
      const nextCell = nextRow.cells[0];
      if (nextCell) {
        this.moveCursorToCell(nextCell, editor);
      }
      return;
    }
    // If last cell of last row, add new row and move to its first cell
    const newRow = tr.cloneNode(true) as HTMLTableRowElement;
    Array.from(newRow.cells).forEach(cell => {
      cell.innerHTML = '&nbsp;';
    });
    table.appendChild(newRow);
    table.setAttribute('data-row-count', String(table.rows.length));
    setTimeout(() => {
      const lastRow = table.rows[table.rows.length - 1] as HTMLTableRowElement;
      const firstCell = lastRow.cells[0];
      if (firstCell) {
        this.moveCursorToCell(firstCell, editor);
        editor.focus();
      }
    }, 0);
  }
} 