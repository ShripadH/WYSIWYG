import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-wysiwyg-toolbar',
  standalone: true,
  templateUrl: './wysiwyg-toolbar.component.html',
  styleUrls: ['./wysiwyg-toolbar.component.css']
})
export class WysiwygToolbarComponent {
  @Output() format = new EventEmitter<{command: string, value?: string}>();
  @Output() heading = new EventEmitter<string>();
  @Output() fontSize = new EventEmitter<string>();
  @Output() insertLink = new EventEmitter<void>();
  @Output() fontFamily = new EventEmitter<string>();
  @Output() fontColor = new EventEmitter<string>();

  emitFontFamily(event: Event) {
    this.fontFamily.emit((event.target as HTMLSelectElement).value);
  }
  emitFontColor(event: Event) {
    this.fontColor.emit((event.target as HTMLInputElement).value);
  }
  emitFontSize(event: Event) {
    this.fontSize.emit((event.target as HTMLSelectElement).value);
  }
  // ...add more as needed
} 