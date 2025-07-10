import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThymeleafRenderService {
  // UI/dialog/menu state for Thymeleaf editing
  showThymeleafDialog = false;
  thymeleafAttr = 'th:text';
  thymeleafVar = '';
  thymeleafAttrOptions = [
    'th:text', 'th:utext', 'th:if', 'th:unless', 'th:each', 'th:replace', 'th:include', 'th:with', 'th:attr'
  ];
  thymeleafMenuPosition: { x: number, y: number } | null = null;
  showThymeleafMenu = false;
  showThymeleafAttrDialog = false;
  thymeleafTargetElement: HTMLElement | null = null;
  thymeleafEachVar = '';
  thymeleafEachCollection = '';
  thymeleafEachFields = '';
  thymeleafEachAddHeader = false;
  thymeleafEachHeaderValues = '';
  showThymeleafEachHandle: boolean = false;
  thymeleafEachHandleTop: number = 0;
  thymeleafEachHandleLeft: number = 0;
  thymeleafEachHandleTarget: HTMLElement | null = null;
  thymeleafHandles: Array<{ table: HTMLElement, top: number, left: number }> = [];
  public savedRange: Range | null = null;

  constructor() { }

  renderTemplate(html: string, data: any): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    this.processNode(doc.body, data);
    return doc.body.innerHTML;
  }

  private processNode(node: Node, data: any) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      // th:remove
      if (el.hasAttribute('th:remove')) {
        el.remove();
        return;
      }
      // th:if
      if (el.hasAttribute('th:if')) {
        const expr = el.getAttribute('th:if')!;
        if (!this.evalExpr(expr, data)) {
          el.remove();
          return;
        }
        el.removeAttribute('th:if');
      }
      // th:unless
      if (el.hasAttribute('th:unless')) {
        const expr = el.getAttribute('th:unless')!;
        if (this.evalExpr(expr, data)) {
          el.remove();
          return;
        }
        el.removeAttribute('th:unless');
      }
      // th:each
      if (el.hasAttribute('th:each')) {
        const expr = el.getAttribute('th:each')!;
        const match = expr.match(/(\w+)\s*:\s*\$\{(.+?)\}/);
        if (match) {
          const varName = match[1];
          const arr = this.evalExpr('${' + match[2] + '}', data);
          if (Array.isArray(arr)) {
            const parent = el.parentElement;
            if (parent) {
              arr.forEach((item: any) => {
                const clone = el.cloneNode(true) as HTMLElement;
                const newData = { ...data, [varName]: item };
                clone.removeAttribute('th:each');
                this.processNode(clone, newData);
                parent.insertBefore(clone, el);
              });
              el.remove();
              return;
            }
          }
        }
      }
      // th:text
      if (el.hasAttribute('th:text')) {
        const expr = el.getAttribute('th:text')!;
        el.textContent = this.evalExpr(expr, data);
        el.removeAttribute('th:text');
      }
      // th:utext
      if (el.hasAttribute('th:utext')) {
        const expr = el.getAttribute('th:utext')!;
        el.innerHTML = this.evalExpr(expr, data);
        el.removeAttribute('th:utext');
      }
      // th:attr
      if (el.hasAttribute('th:attr')) {
        const expr = el.getAttribute('th:attr')!;
        expr.split(',').forEach(pair => {
          const [k, v] = pair.split('=');
          if (k && v) {
            el.setAttribute(k.trim(), this.evalExpr(v.trim(), data));
          }
        });
        el.removeAttribute('th:attr');
      }
      // th:attrappend (TODO)
      // th:class
      if (el.hasAttribute('th:class')) {
        const expr = el.getAttribute('th:class')!;
        el.setAttribute('class', this.evalExpr(expr, data));
        el.removeAttribute('th:class');
      }
      // th:classappend
      if (el.hasAttribute('th:classappend')) {
        const expr = el.getAttribute('th:classappend')!;
        const existing = el.getAttribute('class') || '';
        el.setAttribute('class', existing + ' ' + this.evalExpr(expr, data));
        el.removeAttribute('th:classappend');
      }
      // th:value
      if (el.hasAttribute('th:value')) {
        const expr = el.getAttribute('th:value')!;
        el.setAttribute('value', this.evalExpr(expr, data));
        el.removeAttribute('th:value');
      }
      // th:title
      if (el.hasAttribute('th:title')) {
        const expr = el.getAttribute('th:title')!;
        el.setAttribute('title', this.evalExpr(expr, data));
        el.removeAttribute('th:title');
      }
      // th:href
      if (el.hasAttribute('th:href')) {
        const expr = el.getAttribute('th:href')!;
        el.setAttribute('href', this.evalExpr(expr, data));
        el.removeAttribute('th:href');
      }
      // th:style
      if (el.hasAttribute('th:style')) {
        const expr = el.getAttribute('th:style')!;
        el.setAttribute('style', this.evalExpr(expr, data));
        el.removeAttribute('th:style');
      }
      // th:id
      if (el.hasAttribute('th:id')) {
        const expr = el.getAttribute('th:id')!;
        el.setAttribute('id', this.evalExpr(expr, data));
        el.removeAttribute('th:id');
      }
      // th:data-*
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('th:data-')) {
          const dataAttr = attr.name.replace('th:', '');
          el.setAttribute(dataAttr, this.evalExpr(attr.value, data));
          el.removeAttribute(attr.name);
        }
      });
      // TODO: th:attrappend, th:switch, th:case, th:insert, th:replace, th:include, th:fragment, th:action, th:object, th:method, th:field, th:checked, th:selected
      // Process children
      Array.from(el.childNodes).forEach(child => this.processNode(child, data));
    }
  }

  private evalExpr(expr: string, data: any): any {
    // Simple ${...} or literal
    const match = expr.match(/^\$\{(.+?)\}$/);
    if (match) {
      const path = match[1].trim();
      return this.resolvePath(data, path);
    }
    // Literal string or number
    if (/^['"].*['"]$/.test(expr)) {
      return expr.slice(1, -1);
    }
    // Fallback: try as path
    return this.resolvePath(data, expr.replace(/^\$\{/, '').replace(/\}$/, '').trim());
  }

  private resolvePath(obj: any, path: string): any {
    // Support dot notation: a.b.c
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // --- Thymeleaf UI/menu/dialog logic ---
  confirmThymeleafDialog(editor: HTMLElement, updateHtml: () => void) {
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
    updateHtml();
  }

  cancelThymeleafDialog() {
    this.showThymeleafDialog = false;
    this.savedRange = null;
  }

  onThymeleafMenuClose() {
    this.showThymeleafMenu = false;
    this.showThymeleafAttrDialog = false;
  }

  onThymeleafOpenDialog(attr: string) {
    // Save the current selection
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
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
  }

  onThymeleafCloseDialog() {
    this.showThymeleafAttrDialog = false;
  }

  onThymeleafAttributeChange(event: { attr: string, value: string | null }, updateHtml: () => void) {
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
    updateHtml();
  }





  updateThymeleafHandles(editor: HTMLElement, wysiwygWrapper: HTMLElement, ngZone: any, cdr: any) {
    // Find all tables that contain a tr with th:each or data-th-each
    const tables = Array.from(editor.querySelectorAll('table')).filter(table =>
      table.querySelector('tr[data-th-each]') || 
      Array.from(table.querySelectorAll('tr')).some(tr => tr.hasAttribute('th:each'))
    ) as HTMLElement[];
    const wrapperRect = wysiwygWrapper.getBoundingClientRect();
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
    ngZone.runOutsideAngular(() => {
      setTimeout(() => cdr.detectChanges(), 0);
    });
  }

  // Handler for clicking the edit handle
  onThymeleafEachEditHandleClick(wysiwygWrapper: HTMLElement) {
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

  onThymeleafEachEditHandleClickForTable(table: HTMLElement, wysiwygWrapper: HTMLElement, cdr: any) {
    console.log('[onThymeleafEachEditHandleClickForTable] called for table:', table);
    // Find the first tr with th:each or data-th-each
    let tr = table.querySelector('tr[data-th-each]') as HTMLElement | null;
    if (!tr) {
      tr = Array.from(table.querySelectorAll('tr')).find(tr => tr.hasAttribute('th:each')) as HTMLElement | null;
    }
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
      x: table.getBoundingClientRect().right - wysiwygWrapper.getBoundingClientRect().left - 16,
      y: table.getBoundingClientRect().top - wysiwygWrapper.getBoundingClientRect().top - 32
    };
    this.showThymeleafAttrDialog = true;
    this.showThymeleafMenu = false;
    console.log('[onThymeleafEachEditHandleClickForTable] showThymeleafAttrDialog:', this.showThymeleafAttrDialog);
    cdr.detectChanges();
    console.log('[onThymeleafEachEditHandleClickForTable] after detectChanges');
  }

  // Save edited th:each values back to the table and cells
  saveThymeleafEachEdit(updateHtml: () => void) {
    if (!this.thymeleafTargetElement) return;
    // Find the first tr with th:each or data-th-each
    let tr = this.thymeleafTargetElement.querySelector('tr[data-th-each]') as HTMLElement | null;
    if (!tr) {
      tr = Array.from(this.thymeleafTargetElement.querySelectorAll('tr')).find(tr => tr.hasAttribute('th:each')) as HTMLElement | null;
    }
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
    updateHtml();
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = false;
  }





  // Mouse over handler for showing Thymeleaf handles
  onEditorMouseOver(event: MouseEvent, wysiwygWrapper: HTMLElement) {
    let target = event.target as HTMLElement;
    // Find the closest th:each table from the event target
    let table = target.closest('table');
    while (table && !table.hasAttribute('th:each') && table.parentElement) {
      table = table.parentElement.closest('table');
    }
    if (table && table.hasAttribute('th:each')) {
      const rect = table.getBoundingClientRect();
      const wrapperRect = wysiwygWrapper.getBoundingClientRect();
      this.thymeleafEachHandleTop = rect.top - wrapperRect.top - 28;
      this.thymeleafEachHandleLeft = rect.left - wrapperRect.left + 8;
      this.showThymeleafEachHandle = true;
      this.thymeleafEachHandleTarget = table as HTMLElement;
    }
  }

  // Mouse out handler for hiding Thymeleaf handles
  onEditorMouseOut(event: MouseEvent) {
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
  }

  // Context menu handler for Thymeleaf
  onEditorContextMenu(event: MouseEvent, updateHtml: () => void) {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
    // Check if we have a selection
    if (sel && sel.toString().trim()) {
      // Create a span with thymeleaf-var class around the selection
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'thymeleaf-var';
      span.setAttribute('contenteditable', 'true');
      // SAFER: clone contents, append, delete, insert
      const frag = range.cloneContents();
      span.appendChild(frag);
      range.deleteContents();
      range.insertNode(span);
      // Move selection to the new span
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
      updateHtml();
    } else {
      // If no selection, do nothing
      return;
    }
    // Always close all dialogs before opening the menu
    this.showThymeleafDialog = false;
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = true;
    this.thymeleafMenuPosition = { x: event.clientX, y: event.clientY };
    this.thymeleafTargetElement = target;
  }

  // Insert HTML handler for Thymeleaf
  onInsertHtml(html: string, editor: HTMLElement, wysiwygWrapper: HTMLElement, ngZone: any, cdr: any, updateHtml: () => void, injectTableResizeHandles: () => void) {
    if (this.savedRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedRange);
      this.savedRange = null;
    }
    // Note: insertHtmlAtCursor would need to be called from component
    updateHtml();
    injectTableResizeHandles();
    this.showThymeleafAttrDialog = false;
    this.showThymeleafMenu = false;
    this.updateThymeleafHandles(editor, wysiwygWrapper, ngZone, cdr);
  }
}
