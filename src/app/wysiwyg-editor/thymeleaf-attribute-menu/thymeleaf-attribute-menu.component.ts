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
    'th:text', 'th:href', 'th:src', 'th:each', 'th:if', 'th:unless', 'th:value', 'th:field', 'th:replace', 'th:include', 'th:class', 'th:classappend'
  ];

  selectedAttribute: string | null = null;
  attributeValue: string = '';

  // For th:each dialog
  eachVar: string = '';
  eachCollection: string = '';
  eachFields: string = '';
  eachAddHeader: boolean = false;
  eachHeaderValues: string = '';

  // For th:field dialog
  fieldValue: string = '';

  // For th:replace/include dialog
  fragmentValue: string = '';

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
    this.selectedAttribute = attr;
    if (this.targetElement) {
      if (attr === 'th:each') {
        // Parse th:each value if present
        const val = this.targetElement.getAttribute(attr) || '';
        const match = val.match(/(\w+)\s*:\s*\$\{(.+?)\}/);
        this.eachVar = match ? match[1] : '';
        this.eachCollection = match ? match[2] : '';
      } else if (attr === 'th:field') {
        const val = this.targetElement.getAttribute(attr) || '';
        const match = val.match(/\*\{(.+?)\}/);
        this.fieldValue = match ? match[1] : '';
      } else if (attr === 'th:replace' || attr === 'th:include') {
        this.fragmentValue = this.targetElement.getAttribute(attr) || '';
      } else {
        this.attributeValue = this.targetElement.getAttribute(attr) || '';
      }
    } else {
      this.attributeValue = '';
      this.eachVar = '';
      this.eachCollection = '';
      this.fieldValue = '';
      this.fragmentValue = '';
    }
    this.openDialog.emit(attr);
  }

  onDialogSubmit() {
    if (this.selectedAttribute) {
      let value = this.attributeValue.trim();
      if (this.selectedAttribute === 'th:each') {
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
          tableHtml += `<tr th:each="${this.eachVar} : \${this.eachCollection}">`;
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
          this.fieldValue = '';
          this.fragmentValue = '';
          this.closeDialog.emit();
          return;
        } else {
          alert('Please fill all required fields.');
          return;
        }
      } else if (this.selectedAttribute === 'th:field') {
        if (this.fieldValue) {
          value = `*{${this.fieldValue}}`;
        } else {
          value = '';
        }
      } else if (this.selectedAttribute === 'th:replace' || this.selectedAttribute === 'th:include') {
        value = this.fragmentValue.trim();
      } else if (this.selectedAttribute === 'th:href' || this.selectedAttribute === 'th:src') {
        // Allow @{...} or literal
        if (value && !/^@\{.*\}$/.test(value)) {
          value = `@{${value}}`;
        }
      } else if ([
        'th:text', 'th:if', 'th:unless', 'th:value', 'th:class', 'th:classappend'
      ].includes(this.selectedAttribute)) {
        // Wrap as ${...} if not already and if simple variable or expression
        if (value && !/^\$\{.*\}$/.test(value) && /^[\w.]+$/.test(value)) {
          value = ` 4{${value}}`;
          value = value.replace('\u00024', '$'); // ensure $ is used
        }
      }
      this.attributeChange.emit({ attr: this.selectedAttribute, value });
      this.selectedAttribute = null;
      this.attributeValue = '';
      this.eachVar = '';
      this.eachCollection = '';
      this.eachFields = '';
      this.eachAddHeader = false;
      this.eachHeaderValues = '';
      this.fieldValue = '';
      this.fragmentValue = '';
      this.closeDialog.emit();
    }
  }

  onDialogCancel() {
    this.selectedAttribute = null;
    this.attributeValue = '';
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
