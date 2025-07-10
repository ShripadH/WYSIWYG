import { Component, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPickerComponent } from '../color-picker.component';

@Component({
  selector: 'app-wysiwyg-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ColorPickerComponent],
  templateUrl: './wysiwyg-toolbar.component.html',
  styleUrls: ['./wysiwyg-toolbar.component.css']
})
export class WysiwygToolbarComponent implements OnDestroy {
  @Output() format = new EventEmitter<{command: string, value?: string}>();
  @Output() heading = new EventEmitter<string>();
  @Output() fontSize = new EventEmitter<string>();
  @Output() insertLink = new EventEmitter<void>();
  @Output() fontFamily = new EventEmitter<string>();
  @Output() fontColor = new EventEmitter<string>();
  @Output() toggleHtml = new EventEmitter<void>();
  @Output() showTableGrid = new EventEmitter<void>();
  @Output() insertImage = new EventEmitter<void>();

  hexColor: string = '#000000';
  showColorPicker = false;

  @ViewChild('colorPickerPopup') colorPickerPopupRef?: ElementRef;
  private documentClickListener?: () => void;

  toggleColorPicker() {
    this.showColorPicker = !this.showColorPicker;
    if (this.showColorPicker) {
      setTimeout(() => this.addDocumentClickListener());
    } else {
      this.removeDocumentClickListener();
    }
  }

  closeColorPicker() {
    this.showColorPicker = false;
    this.removeDocumentClickListener();
  }

  private addDocumentClickListener() {
    this.removeDocumentClickListener();
    this.documentClickListener = () => {
      document.addEventListener('mousedown', this.handleDocumentClick, true);
    };
    document.addEventListener('mousedown', this.handleDocumentClick, true);
  }

  private removeDocumentClickListener() {
    document.removeEventListener('mousedown', this.handleDocumentClick, true);
  }

  handleDocumentClick = (event: MouseEvent) => {
    if (!this.colorPickerPopupRef?.nativeElement) return;
    if (!this.colorPickerPopupRef.nativeElement.contains(event.target)) {
      this.closeColorPicker();
    }
  };

  ngOnDestroy() {
    this.removeDocumentClickListener();
  }

  emitFontFamily(event: Event) {
    this.fontFamily.emit((event.target as HTMLSelectElement).value);
  }
  emitFontColor(eventOrColor: Event | string) {
    let value: string;
    if (typeof eventOrColor === 'string') {
      value = eventOrColor;
    } else {
      value = (eventOrColor.target as HTMLInputElement).value;
    }
    this.hexColor = value;
    this.fontColor.emit(value);
    this.closeColorPicker();
  }

  onHexColorChange() {
    if (/^#[A-Fa-f0-9]{6}$/.test(this.hexColor)) {
      this.fontColor.emit(this.hexColor);
    }
  }
  emitFontSize(event: Event) {
    this.fontSize.emit((event.target as HTMLSelectElement).value);
  }
  toggleTableGrid() {
    this.showTableGrid.emit();
  }
  onInsertImage() {
    this.insertImage.emit();
  }
  // ...add more as needed
} 