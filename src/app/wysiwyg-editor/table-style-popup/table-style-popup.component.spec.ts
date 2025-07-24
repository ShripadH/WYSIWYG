import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableStylePopupComponent } from './table-style-popup.component';

// Utility function to check if a value is a valid DOM element
function isDomElement(el: any): el is Element {
  return el instanceof Element;
}

describe('TableStylePopupComponent', () => {
  let component: TableStylePopupComponent;
  let fixture: ComponentFixture<TableStylePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableStylePopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableStylePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (document.body) {
      document.querySelectorAll('div, table, span, img').forEach(el => {
        if (el.parentNode === document.body && isDomElement(el)) {
          el.remove();
        }
      });
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle border color change', () => {
    component.onBorderColorChange('#123456');
    expect(component.borderColor).toBe('#123456');
  });

  it('should handle border width change', () => {
    component.onBorderWidthChange(5);
    expect(component.borderWidth).toBe(5);
  });

  it('should handle border style change', () => {
    component.onBorderStyleChange('dotted');
    expect(component.borderStyle).toBe('dotted');
  });

  it('should handle cell background color change', () => {
    component.onCellBgColorChange('#abcdef');
    expect(component.cellBgColor).toBe('#abcdef');
  });

  it('should handle cell align change', () => {
    component.onCellAlignChange('center');
    expect(component.cellAlign).toBe('center');
  });

  it('should handle cell vertical align change', () => {
    component.onCellVAlignChange('bottom');
    expect(component.cellVAlign).toBe('bottom');
  });

  it('should handle table width change and presets', () => {
    component.onTableWidthChange('80%');
    expect(component.tableWidth).toBe('80%');
    component.setTableWidthPreset('100%');
    expect(component.tableWidth).toBe('100%');
  });

  it('should handle table alignment', () => {
    component.setTableAlign('center');
    expect(component.tableAlign).toBe('center');
    component.setTableAlign('right');
    expect(component.tableAlign).toBe('right');
  });

  it('should open and close table border color picker', () => {
    component.openTableBorderColorPicker();
    expect(component.showTableBorderColorPicker).toBeTrue();
    component.closeTableBorderColorPicker();
    expect(component.showTableBorderColorPicker).toBeFalse();
  });

  it('should handle table border color selected', () => {
    spyOn(component, 'onBorderColorChange');
    spyOn(component, 'closeTableBorderColorPicker');
    component.onTableBorderColorSelected('#fff');
    expect(component.onBorderColorChange).toHaveBeenCalledWith('#fff');
    expect(component.closeTableBorderColorPicker).toHaveBeenCalled();
  });

  it('should open and close row top border color picker', () => {
    component.openRowTopBorderColorPicker();
    expect(component.showRowTopBorderColorPicker).toBeTrue();
    component.closeRowTopBorderColorPicker();
    expect(component.showRowTopBorderColorPicker).toBeFalse();
  });

  it('should handle row top border color selected', () => {
    component.onRowTopBorderColorSelected('#aaa');
    expect(component.topBorderColor).toBe('#aaa');
    expect(component.showRowTopBorderColorPicker).toBeFalse();
  });

  it('should open and close row bottom border color picker', () => {
    component.openRowBottomBorderColorPicker();
    expect(component.showRowBottomBorderColorPicker).toBeTrue();
    component.closeRowBottomBorderColorPicker();
    expect(component.showRowBottomBorderColorPicker).toBeFalse();
  });

  it('should handle row bottom border color selected', () => {
    component.onRowBottomBorderColorSelected('#bbb');
    expect(component.bottomBorderColor).toBe('#bbb');
    expect(component.showRowBottomBorderColorPicker).toBeFalse();
  });

  it('should open and close cell background color picker', () => {
    component.openCellBgColorPicker();
    expect(component.showCellBgColorPicker).toBeTrue();
    component.closeCellBgColorPicker();
    expect(component.showCellBgColorPicker).toBeFalse();
  });

  it('should handle cell background color selected', () => {
    spyOn(component, 'onCellBgColorChange');
    spyOn(component, 'closeCellBgColorPicker');
    component.onCellBgColorSelected('#ccc');
    expect(component.onCellBgColorChange).toHaveBeenCalledWith('#ccc');
    expect(component.closeCellBgColorPicker).toHaveBeenCalled();
  });

  it('should emit applyStyle for table', () => {
    spyOn(component.applyStyle, 'emit');
    component.styleType = 'table';
    component.borderColor = '#111';
    component.borderWidth = 2;
    component.borderStyle = 'solid';
    component.tableWidth = '80%';
    component.tableAlign = 'center';
    component.apply();
    expect(component.applyStyle.emit).toHaveBeenCalledWith({
      type: 'table',
      styles: jasmine.objectContaining({ borderColor: '#111', borderWidth: 2, borderStyle: 'solid', tableWidth: '80%', tableAlign: 'center' })
    });
  });

  it('should emit applyStyle for row', () => {
    spyOn(component.applyStyle, 'emit');
    component.styleType = 'row';
    component.topBorderColor = '#222';
    component.topBorderWidth = 3;
    component.topBorderStyle = 'dashed';
    component.bottomBorderColor = '#333';
    component.bottomBorderWidth = 4;
    component.bottomBorderStyle = 'dotted';
    component.apply();
    expect(component.applyStyle.emit).toHaveBeenCalledWith({
      type: 'row',
      styles: jasmine.objectContaining({ topBorderColor: '#222', topBorderWidth: 3, topBorderStyle: 'dashed', bottomBorderColor: '#333', bottomBorderWidth: 4, bottomBorderStyle: 'dotted' })
    });
  });

  it('should emit applyStyle for cell', () => {
    spyOn(component.applyStyle, 'emit');
    component.styleType = 'cell';
    component.cellBgColor = '#444';
    component.cellAlign = 'right';
    component.cellVAlign = 'bottom';
    component.apply();
    expect(component.applyStyle.emit).toHaveBeenCalledWith({
      type: 'cell',
      styles: jasmine.objectContaining({ bgColor: '#444', align: 'right', vAlign: 'bottom' })
    });
  });

  it('should emit close on closePopup', () => {
    spyOn(component.close, 'emit');
    component.closePopup();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
