import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent {
  themeColors: string[][] = [
    ['#000000', '#1F497D', '#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646'],
    ['#7F7F7F', '#C6D9F0', '#DBE5F1', '#F2DCDB', '#EBF1DD', '#E5E0EC', '#DCE6F1', '#FDEADA'],
    ['#595959', '#8DB3E2', '#B8CCE4', '#E5B9B7', '#D7E3BC', '#CCC1D9', '#B7DEE8', '#FBD5B5'],
    ['#404040', '#548DD4', '#95B3D7', '#D99694', '#C3D69B', '#B2A2C7', '#92CDDC', '#FAC08F'],
    ['#262626', '#17365D', '#366092', '#953734', '#76923C', '#604A7B', '#31859B', '#E36C09']
  ];
  standardColors: string[] = [
    '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#000000', '#FFFFFF'
  ];
  @Output() colorSelected = new EventEmitter<string>();

  showMoreColors = false;
  moreColor = '#000000';

  selectColor(color: string) {
    this.colorSelected.emit(color);
    this.showMoreColors = false;
  }

  openMoreColors() {
    this.showMoreColors = true;
  }

  onMoreColorChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.moreColor = value;
    this.selectColor(value);
  }
} 