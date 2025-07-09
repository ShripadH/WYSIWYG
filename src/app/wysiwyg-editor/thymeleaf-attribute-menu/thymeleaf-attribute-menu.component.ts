import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thymeleaf-attribute-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './thymeleaf-attribute-menu.component.html',
  styleUrl: './thymeleaf-attribute-menu.component.css'
})
export class ThymeleafAttributeMenuComponent implements OnChanges {
  @Input() targetElement: HTMLElement | null = null;
  @Input() menuPosition: { x: number, y: number } | null = null;
  @Input() showMenu = false;
  @Input() showDialog = false;

  @Output() attributeChange = new EventEmitter<{ attr: string, value: string|null }>();
  @Output() closeMenu = new EventEmitter<void>();
  @Output() openDialog = new EventEmitter<string>();
  @Output() closeDialog = new EventEmitter<void>();
  @Output() insertHtml = new EventEmitter<string>();

  supportedAttributes = [
    'th:text', 'th:href', 'th:each', 'th:if', 'th:unless', 'th:remove'
  ];

  selectedAttribute: string | null = null;
  attributeValue: string = '';

  // For th:each dialog
  eachVar: string = '';
  eachCollection: string = '';
  eachFields: string = '';
  eachAddHeader: boolean = false;
  eachHeaderValues: string = '';

  // For th:replace/include dialog
  fragmentValue: string = '';

  hrefValue: string = '';
  hrefThText: string = '';
  hrefAnchorText: string = '';

  savedRange: Range | null = null;

  get presentAttributes(): string[] {
    if (!this.targetElement) return [];
    return this.supportedAttributes.filter(attr => {
      if (attr.endsWith('-*')) {
        // For th:data-*, check for any th:data- attribute
        return Array.from(this.targetElement!.attributes).some(a => a.name.startsWith(attr.replace('*', '')));
      }
      return this.targetElement!.hasAttribute(attr);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showDialog'] && this.showDialog && this.selectedAttribute && this.targetElement) {
      this.attributeValue = this.targetElement.getAttribute(this.selectedAttribute) || '';
    }
  }

  onMenuSelect(attr: string) {
    // Save the current selection before opening the dialog
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
    this.selectedAttribute = attr;
    if (this.targetElement) {
      if (attr === 'th:each') {
        // Parse th:each value if present
        const val = this.targetElement.getAttribute(attr) || '';
        const match = val.match(/(\w+)\s*:\s*\$\{(.+?)\}/);
        this.eachVar = match ? match[1] : '';
        this.eachCollection = match ? match[2] : '';
      } else if (attr === 'th:replace' || attr === 'th:include') {
        this.fragmentValue = this.targetElement.getAttribute(attr) || '';
      } else {
        this.attributeValue = this.targetElement.getAttribute(attr) || '';
      }
    } else {
      this.attributeValue = '';
      this.eachVar = '';
      this.eachCollection = '';
      this.fragmentValue = '';
    }
    this.openDialog.emit(attr);
  }

  onDialogSubmit() {
    if (this.selectedAttribute) {
      // Restore the saved selection before applying changes
      if (this.savedRange) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(this.savedRange);
      }
      let value = this.attributeValue.trim();
      switch (this.selectedAttribute) {
        case 'th:each':
          if (this.eachVar && this.eachCollection && this.eachFields) {
            const fields = this.eachFields.split(',').map(f => f.trim()).filter(f => f);
            if (fields.length === 0) {
              alert('Please specify at least one field.');
              return;
            }
            let tableHtml = '<table class="thymeleaf-loop-table">';
            if (this.eachAddHeader) {
              const headerVals = (this.eachHeaderValues || '').split(',').map(h => h.trim());
              tableHtml += '<tr>';
              fields.forEach((field, i) => {
                const header = headerVals[i] || field.charAt(0).toUpperCase() + field.slice(1);
                tableHtml += '<th>' + header + '</th>';
              });
              tableHtml += '</tr>';
            }
            tableHtml += `<tr th:each="${this.eachVar} :\${${this.eachCollection}}">`;
            fields.forEach(field => {
              tableHtml += `<td th:text="\${${this.eachVar}.${field}}">${this.eachVar}.${field}</td>`;
            });
            tableHtml += '</tr></table>';
            tableHtml = tableHtml.replace(/\\\$/g, '$'); // ensure $ is used
            this.insertHtml.emit(tableHtml);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.eachVar = '';
            this.eachCollection = '';
            this.eachFields = '';
            this.eachAddHeader = false;
            this.eachHeaderValues = '';
            this.fragmentValue = '';
            this.closeDialog.emit();
            return;
          } else {
            alert('Please fill all required fields.');
            return;
          }
        case 'th:href':
          // Use dialog values for href, th:text, and anchor text
          const href = this.hrefValue || '@{/user/{id}(id=${user.id})}';
          const thText = this.hrefThText || '${user.name}';
          const anchorText = this.hrefAnchorText || 'Profile';
          const anchorHtml = `<a th:href="${href}" th:text="\${${thText}}">${anchorText}</a>`;
          this.insertHtml.emit(anchorHtml);
          this.selectedAttribute = null;
          this.attributeValue = '';
          this.hrefValue = '';
          this.hrefThText = '';
          this.hrefAnchorText = '';
          this.closeDialog.emit();
          return;
        case 'th:remove':
          // Wrap the entire selection in a new div with th:remove and emit the HTML
          const thRemoveValue = this.attributeValue || 'all';
          const selectionRemove = window.getSelection();
          if (selectionRemove && selectionRemove.rangeCount > 0 && !selectionRemove.isCollapsed) {
            const range = selectionRemove.getRangeAt(0);
            const selectedContent = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(selectedContent);
            const html = `<div th:remove=\"${thRemoveValue}\">${tempDiv.innerHTML}</div>`;
            this.insertHtml.emit(html);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          }
          // Fallback: single element or insertHtml
          if (this.targetElement) {
            this.targetElement.setAttribute('th:remove', thRemoveValue);
            this.attributeChange.emit({ attr: 'th:remove', value: thRemoveValue });
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          } else {
            // Fallback: insert a span if no targetElement
            const thRemoveHtml = `<span th:remove=\"${thRemoveValue}\">${thRemoveValue}</span>`;
            this.insertHtml.emit(thRemoveHtml);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          }
        case 'th:text':
          // Insert a span with th:text using the dialog value
          const thTextValue = this.attributeValue || 'value';
          const thTextHtml = `<span th:text="\${'${' + thTextValue + '}'}">${thTextValue}</span>`;
          this.insertHtml.emit(thTextHtml);
          this.selectedAttribute = null;
          this.attributeValue = '';
          this.closeDialog.emit();
          return;
        case 'th:if':
          // Wrap the entire selection in a new div with th:if and emit the HTML
          const thIfValue = this.attributeValue || 'condition';
          const thIfExpr = `\${${thIfValue}}`;
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const selectedContent = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(selectedContent);
            const html = `<div th:if=\"${thIfExpr}\">${tempDiv.innerHTML}</div>`;
            this.insertHtml.emit(html);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          }
          // Fallback: single element or insertHtml
          if (this.targetElement) {
            this.targetElement.setAttribute('th:if', thIfExpr);
            this.attributeChange.emit({ attr: 'th:if', value: thIfExpr });
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          } else {
            // Fallback: insert a span if no targetElement
            const thIfHtml = `<span th:if=\"${thIfExpr}\">${thIfValue}</span>`;
            this.insertHtml.emit(thIfHtml);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          }
        case 'th:unless':
          // Wrap the entire selection in a new div with th:unless and emit the HTML
          const thUnlessValue = this.attributeValue || 'condition';
          const thUnlessExpr = `\${${thUnlessValue}}`;
          const selectionUnless = window.getSelection();
          if (selectionUnless && selectionUnless.rangeCount > 0 && !selectionUnless.isCollapsed) {
            const range = selectionUnless.getRangeAt(0);
            const selectedContent = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(selectedContent);
            const html = `<div th:unless=\"${thUnlessExpr}\">${tempDiv.innerHTML}</div>`;
            this.insertHtml.emit(html);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          }
          // Fallback: single element or insertHtml
          if (this.targetElement) {
            this.targetElement.setAttribute('th:unless', thUnlessExpr);
            this.attributeChange.emit({ attr: 'th:unless', value: thUnlessExpr });
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          } else {
            // Fallback: insert a span if no targetElement
            const thUnlessHtml = `<span th:unless=\"${thUnlessExpr}\">${thUnlessValue}</span>`;
            this.insertHtml.emit(thUnlessHtml);
            this.selectedAttribute = null;
            this.attributeValue = '';
            this.closeDialog.emit();
            return;
          }
        default:
          break;
      }
      this.attributeChange.emit({ attr: this.selectedAttribute, value });
      this.selectedAttribute = null;
      this.attributeValue = '';
      this.eachVar = '';
      this.eachCollection = '';
      this.eachFields = '';
      this.eachAddHeader = false;
      this.eachHeaderValues = '';
      this.fragmentValue = '';
      this.hrefValue = '';
      this.hrefThText = '';
      this.hrefAnchorText = '';
      this.closeDialog.emit();
    }
  }

  onDialogCancel() {
    this.selectedAttribute = null;
    this.attributeValue = '';
    this.hrefValue = '';
    this.hrefThText = '';
    this.hrefAnchorText = '';
    this.closeDialog.emit();
  }

  onMenuClose() {
    this.closeMenu.emit();
  }

  removeAttribute(attr: string) {
    this.attributeChange.emit({ attr, value: null });
    this.onMenuClose();
  }
}
