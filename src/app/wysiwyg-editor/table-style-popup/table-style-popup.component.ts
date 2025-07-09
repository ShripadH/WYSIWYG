import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-style-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-style-popup.component.html',
  styleUrl: './table-style-popup.component.css'
})
export class TableStylePopupComponent {
  // Table style
  @Input() borderColor: string = '#000000';
  @Input() borderWidth: number = 1;
  @Input() borderStyle: string = 'solid';
  // Cell style
  @Input() cellBgColor: string = '#ffffff';
  @Input() cellAlign: string = 'left';
  @Input() cellVAlign: string = 'top';

  @Input() topBorderColor: string = '#000000';
  @Input() topBorderWidth: number = 1;
  @Input() topBorderStyle: string = 'solid';
  @Input() bottomBorderColor: string = '#000000';
  @Input() bottomBorderWidth: number = 1;
  @Input() bottomBorderStyle: string = 'solid';

  @Input() styleType: 'table' | 'row' | 'cell' = 'cell';
  @Input() target: HTMLElement | null = null;
  @Output() applyStyle = new EventEmitter<{ type: 'table' | 'row' | 'cell', styles: any }>();
  @Output() close = new EventEmitter<void>();

  // Table style handlers
  onBorderColorChange(value: string) { this.borderColor = value; }
  onBorderWidthChange(value: number) { this.borderWidth = value; }
  onBorderStyleChange(value: string) { this.borderStyle = value; }
  // Cell style handlers
  onCellBgColorChange(value: string) { this.cellBgColor = value; }
  onCellAlignChange(value: string) { this.cellAlign = value; }
  onCellVAlignChange(value: string) { this.cellVAlign = value; }

  apply() {
    let styles: any = {};
    if (this.styleType === 'table') {
      styles = { borderColor: this.borderColor, borderWidth: this.borderWidth, borderStyle: this.borderStyle };
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
