import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-wysiwyg-toolbar',
  templateUrl: './wysiwyg-toolbar.component.html',
  styleUrls: ['./wysiwyg-toolbar.component.css']
})
export class WysiwygToolbarComponent {
  @Output() format = new EventEmitter<{command: string, value?: string}>();
  @Output() heading = new EventEmitter<string>();
  @Output() fontSize = new EventEmitter<string>();
  @Output() insertLink = new EventEmitter<void>();
  // ...add more as needed
} 