// // All tests commented out for npm packaging
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { WysiwygToolbarComponent } from './wysiwyg-toolbar.component';
// import { By } from '@angular/platform-browser';

// describe('WysiwygToolbarComponent', () => {
//   let component: WysiwygToolbarComponent;
//   let fixture: ComponentFixture<WysiwygToolbarComponent>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [WysiwygToolbarComponent]
//     }).compileComponents();
//     fixture = TestBed.createComponent(WysiwygToolbarComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should emit format event on button click', () => {
//     spyOn(component.format, 'emit');
//     const boldBtn = fixture.debugElement.query(By.css('button[title="Bold"]'));
//     boldBtn.nativeElement.click();
//     expect(component.format.emit).toHaveBeenCalledWith({ command: 'bold' });
//   });

//   it('should emit heading event on select change', () => {
//     spyOn(component.heading, 'emit');
//     const select = fixture.debugElement.query(By.css('select[title="Heading"]'));
//     select.nativeElement.value = 'H2';
//     select.nativeElement.dispatchEvent(new Event('change'));
//     expect(component.heading.emit).toHaveBeenCalledWith('H2');
//   });

//   it('should emit fontSize event on select change', () => {
//     spyOn(component.fontSize, 'emit');
//     const select = fixture.debugElement.queryAll(By.css('select'))[1];
//     select.nativeElement.value = '18px';
//     select.nativeElement.dispatchEvent(new Event('change'));
//     expect(component.fontSize.emit).toHaveBeenCalledWith('18px');
//   });

//   it('should emit fontFamily event on select change', () => {
//     spyOn(component.fontFamily, 'emit');
//     const select = fixture.debugElement.queryAll(By.css('select'))[2];
//     select.nativeElement.value = 'Verdana';
//     select.nativeElement.dispatchEvent(new Event('change'));
//     expect(component.fontFamily.emit).toHaveBeenCalledWith('Verdana');
//   });

//   it('should emit insertLink event on button click', () => {
//     spyOn(component.insertLink, 'emit');
//     const btn = fixture.debugElement.query(By.css('button[title="Insert Link"]'));
//     btn.nativeElement.click();
//     expect(component.insertLink.emit).toHaveBeenCalled();
//   });

//   it('should emit toggleHtml event on button click', () => {
//     spyOn(component.toggleHtml, 'emit');
//     const btn = fixture.debugElement.query(By.css('button[title="Show/Hide HTML"]'));
//     btn.nativeElement.click();
//     expect(component.toggleHtml.emit).toHaveBeenCalled();
//   });

//   it('should emit showTableGrid event on button click', () => {
//     spyOn(component.showTableGrid, 'emit');
//     const btn = fixture.debugElement.query(By.css('button[title="Insert Table"]'));
//     btn.nativeElement.click();
//     expect(component.showTableGrid.emit).toHaveBeenCalled();
//   });

//   it('should emit insertImage event on button click', () => {
//     spyOn(component.insertImage, 'emit');
//     const btn = fixture.debugElement.query(By.css('button[title="Insert Image"]'));
//     btn.nativeElement.click();
//     expect(component.insertImage.emit).toHaveBeenCalled();
//   });

//   it('should toggle color picker', () => {
//     expect(component.showColorPicker).toBeFalse();
//     component.toggleColorPicker();
//     expect(component.showColorPicker).toBeTrue();
//     component.toggleColorPicker();
//     expect(component.showColorPicker).toBeFalse();
//   });

//   it('should close color picker', () => {
//     component.showColorPicker = true;
//     component.closeColorPicker();
//     expect(component.showColorPicker).toBeFalse();
//   });

//   it('should emit fontColor and close color picker on emitFontColor (string)', () => {
//     spyOn(component.fontColor, 'emit');
//     spyOn(component, 'closeColorPicker');
//     component.emitFontColor('#123456');
//     expect(component.fontColor.emit).toHaveBeenCalledWith('#123456');
//     expect(component.closeColorPicker).toHaveBeenCalled();
//   });

//   it('should emit fontColor and close color picker on emitFontColor (event)', () => {
//     spyOn(component.fontColor, 'emit');
//     spyOn(component, 'closeColorPicker');
//     const event = { target: { value: '#654321' } } as any;
//     component.emitFontColor(event);
//     expect(component.fontColor.emit).toHaveBeenCalledWith('#654321');
//     expect(component.closeColorPicker).toHaveBeenCalled();
//   });

//   it('should emit fontColor on valid hex color change', () => {
//     spyOn(component.fontColor, 'emit');
//     component.hexColor = '#abcdef';
//     component.onHexColorChange();
//     expect(component.fontColor.emit).toHaveBeenCalledWith('#abcdef');
//   });

//   it('should not emit fontColor on invalid hex color change', () => {
//     spyOn(component.fontColor, 'emit');
//     component.hexColor = 'notAColor';
//     component.onHexColorChange();
//     expect(component.fontColor.emit).not.toHaveBeenCalled();
//   });

//   it('should remove document click listener on destroy', () => {
//     spyOn(component as any, 'removeDocumentClickListener');
//     component.ngOnDestroy();
//     expect((component as any).removeDocumentClickListener).toHaveBeenCalled();
//   });
// }); 