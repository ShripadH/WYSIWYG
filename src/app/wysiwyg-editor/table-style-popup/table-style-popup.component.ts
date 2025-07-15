import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPickerComponent } from '../color-picker.component';

@Component({
  selector: 'app-table-style-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, ColorPickerComponent],
  templateUrl: './table-style-popup.component.html',
  styleUrl: './table-style-popup.component.css'
})
export class TableStylePopupComponent {
  // Table style
  @Input() borderColor: string = '#e0e0e0';
  @Input() borderWidth: number = 1;
  @Input() borderStyle: string = 'solid';
  // Cell style
  @Input() cellBgColor: string = '#e0e0e0';
  @Input() cellAlign: string = 'left';
  @Input() cellVAlign: string = 'top';

  @Input() topBorderColor: string = '#e0e0e0';
  @Input() topBorderWidth: number = 1;
  @Input() topBorderStyle: string = 'solid';
  @Input() bottomBorderColor: string = '#e0e0e0';
  @Input() bottomBorderWidth: number = 1;
  @Input() bottomBorderStyle: string = 'solid';

  @Input() styleType: 'table' | 'row' | 'cell' = 'cell';
  @Input() target: HTMLElement | null = null;
  @Output() applyStyle = new EventEmitter<{ type: 'table' | 'row' | 'cell', styles: any }>();
  @Output() close = new EventEmitter<void>();

  showTableBorderColorPicker = false;
  showRowTopBorderColorPicker = false;
  showRowBottomBorderColorPicker = false;
  showCellBgColorPicker = false;

  // --- New: Table width and alignment ---
  tableWidth: string = '';
  tableAlign: 'left' | 'center' | 'right' = 'left';

  // Table style handlers
  onBorderColorChange(value: string) { this.borderColor = value; }
  onBorderWidthChange(value: number) { this.borderWidth = value; }
  onBorderStyleChange(value: string) { this.borderStyle = value; }
  // Cell style handlers
  onCellBgColorChange(value: string) { this.cellBgColor = value; }
  onCellAlignChange(value: string) { this.cellAlign = value; }
  onCellVAlignChange(value: string) { this.cellVAlign = value; }

  // --- New: Table width and alignment handlers ---
  onTableWidthChange(value: string) { this.tableWidth = value; }
  setTableWidthPreset(val: string) { this.tableWidth = val; }
  setTableAlign(val: 'left' | 'center' | 'right') { this.tableAlign = val; }

  openTableBorderColorPicker() { this.showTableBorderColorPicker = true; }
  closeTableBorderColorPicker() { this.showTableBorderColorPicker = false; }
  onTableBorderColorSelected(color: string) {
    this.onBorderColorChange(color);
    this.closeTableBorderColorPicker();
  }

  openRowTopBorderColorPicker() { this.showRowTopBorderColorPicker = true; }
  closeRowTopBorderColorPicker() { this.showRowTopBorderColorPicker = false; }
  onRowTopBorderColorSelected(color: string) {
    this.topBorderColor = color;
    this.closeRowTopBorderColorPicker();
  }

  openRowBottomBorderColorPicker() { this.showRowBottomBorderColorPicker = true; }
  closeRowBottomBorderColorPicker() { this.showRowBottomBorderColorPicker = false; }
  onRowBottomBorderColorSelected(color: string) {
    this.bottomBorderColor = color;
    this.closeRowBottomBorderColorPicker();
  }

  openCellBgColorPicker() { this.showCellBgColorPicker = true; }
  closeCellBgColorPicker() { this.showCellBgColorPicker = false; }
  onCellBgColorSelected(color: string) {
    this.onCellBgColorChange(color);
    this.closeCellBgColorPicker();
  }

  apply() {
    let styles: any = {};
    if (this.styleType === 'table') {
      styles = {
        borderColor: this.borderColor,
        borderWidth: this.borderWidth,
        borderStyle: this.borderStyle,
        tableWidth: this.tableWidth,
        tableAlign: this.tableAlign
      };
    } else if (this.styleType === 'row') {
      styles = {
        topBorderColor: this.topBorderColor,
        topBorderWidth: this.topBorderWidth,
        topBorderStyle: this.topBorderStyle,
        bottomBorderColor: this.bottomBorderColor,
        bottomBorderWidth: this.bottomBorderWidth,
        bottomBorderStyle: this.bottomBorderStyle
      };
    } else if (this.styleType === 'cell') {
      styles = { bgColor: this.cellBgColor, align: this.cellAlign, vAlign: this.cellVAlign };
    }
    console.log('Popup apply() called', this.styleType, styles);
    this.applyStyle.emit({ type: this.styleType, styles });
  }

  closePopup() {
    this.close.emit();
  }
}
