import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cell-style-sidebar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cell-style-sidebar.component.html',
  styleUrls: ['./cell-style-sidebar.component.css']
})
export class CellStyleSidebarComponent {
  @Input() bgColor: string = '#ffffff';
  @Input() align: string = 'left';
  @Input() vAlign: string = 'top';
  @Output() apply = new EventEmitter<{bgColor: string, align: string, vAlign: string}>();
  @Output() close = new EventEmitter<void>();
} 