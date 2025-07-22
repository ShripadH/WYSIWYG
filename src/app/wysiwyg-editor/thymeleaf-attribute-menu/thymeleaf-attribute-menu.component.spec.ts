import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThymeleafAttributeMenuComponent } from './thymeleaf-attribute-menu.component';

describe('ThymeleafAttributeMenuComponent', () => {
  let component: ThymeleafAttributeMenuComponent;
  let fixture: ComponentFixture<ThymeleafAttributeMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThymeleafAttributeMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThymeleafAttributeMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update attributeValue on ngOnChanges when showDialog is true', () => {
    const el = document.createElement('div');
    el.setAttribute('th:text', 'foo');
    component.targetElement = el;
    component.selectedAttribute = 'th:text';
    component.showDialog = false;
    component.ngOnChanges({ showDialog: { currentValue: false, previousValue: false, firstChange: false, isFirstChange: () => false } });
    component.showDialog = true;
    component.ngOnChanges({ showDialog: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
    expect(component.attributeValue).toBe('foo');
  });

  it('presentAttributes returns empty array if no targetElement', () => {
    component.targetElement = null;
    expect(component.presentAttributes).toEqual([]);
  });

  it('presentAttributes returns supported attributes present on targetElement', () => {
    const el = document.createElement('div');
    el.setAttribute('th:text', 'foo');
    component.targetElement = el;
    expect(component.presentAttributes).toContain('th:text');
  });

  it('onMenuSelect sets selectedAttribute and emits openDialog', () => {
    spyOn(component.openDialog, 'emit');
    const el = document.createElement('div');
    el.setAttribute('th:text', 'foo');
    component.targetElement = el;
    component.onMenuSelect('th:text');
    expect(component.selectedAttribute).toBe('th:text');
    expect(component.openDialog.emit).toHaveBeenCalledWith('th:text');
  });

  it('onMenuSelect sets eachVar/eachCollection for th:each', () => {
    spyOn(component.openDialog, 'emit');
    const el = document.createElement('div');
    el.setAttribute('th:each', 'item : ${items}');
    component.targetElement = el;
    component.onMenuSelect('th:each');
    expect(component.eachVar).toBe('item');
    expect(component.eachCollection).toBe('items');
  });

  it('onDialogSubmit emits insertHtml for th:text', () => {
    spyOn(component.insertHtml, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:text';
    component.attributeValue = 'foo';
    component.onDialogSubmit();
    expect(component.insertHtml.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
  });

  it('onDialogSubmit emits insertHtml for th:href', () => {
    spyOn(component.insertHtml, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:href';
    component.hrefValue = 'url';
    component.hrefThText = 'txt';
    component.hrefAnchorText = 'anchor';
    component.onDialogSubmit();
    expect(component.insertHtml.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
  });

  it('onDialogSubmit emits insertHtml for th:each with fields', () => {
    spyOn(component.insertHtml, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:each';
    component.eachVar = 'item';
    component.eachCollection = 'items';
    component.eachFields = 'id,name';
    component.onDialogSubmit();
    expect(component.insertHtml.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
  });

  it('onDialogSubmit alerts for th:each with missing fields', () => {
    spyOn(window, 'alert');
    component.selectedAttribute = 'th:each';
    component.eachVar = 'item';
    component.eachCollection = 'items';
    component.eachFields = '';
    component.onDialogSubmit();
    expect(window.alert).toHaveBeenCalled();
  });

  it('onDialogSubmit emits insertHtml for th:remove with selection', () => {
    spyOn(component.insertHtml, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:remove';
    component.attributeValue = 'all';
    // Simulate selection
    const sel = window.getSelection();
    const range = document.createRange();
    const div = document.createElement('div');
    div.textContent = 'test';
    if (!document.body.contains(div)) {
      document.body.appendChild(div);
    }
    range.selectNodeContents(div);
    sel?.removeAllRanges();
    sel?.addRange(range);
    component.onDialogSubmit();
    expect(component.insertHtml.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('onDialogSubmit emits attributeChange for th:remove with targetElement', () => {
    spyOn(component.attributeChange, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:remove';
    component.attributeValue = 'all';
    component.targetElement = document.createElement('div');
    if (!document.body.contains(component.targetElement)) {
      document.body.appendChild(component.targetElement);
    }
    component.onDialogSubmit();
    expect(component.attributeChange.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
    document.body.removeChild(component.targetElement);
  });

  it('onDialogSubmit emits insertHtml for th:if with selection', () => {
    spyOn(component.insertHtml, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:if';
    component.attributeValue = 'cond';
    // Simulate selection
    const sel = window.getSelection();
    const range = document.createRange();
    const div = document.createElement('div');
    div.textContent = 'test';
    if (!document.body.contains(div)) {
      document.body.appendChild(div);
    }
    range.selectNodeContents(div);
    sel?.removeAllRanges();
    sel?.addRange(range);
    component.onDialogSubmit();
    expect(component.insertHtml.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('onDialogSubmit emits attributeChange for th:if with targetElement', () => {
    spyOn(component.attributeChange, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:if';
    component.attributeValue = 'cond';
    component.targetElement = document.createElement('div');
    if (!document.body.contains(component.targetElement)) {
      document.body.appendChild(component.targetElement);
    }
    component.onDialogSubmit();
    expect(component.attributeChange.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
    document.body.removeChild(component.targetElement);
  });

  it('onDialogSubmit emits insertHtml for th:unless with selection', () => {
    spyOn(component.insertHtml, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:unless';
    component.attributeValue = 'cond';
    // Simulate selection
    const sel = window.getSelection();
    const range = document.createRange();
    const div = document.createElement('div');
    div.textContent = 'test';
    if (!document.body.contains(div)) {
      document.body.appendChild(div);
    }
    range.selectNodeContents(div);
    sel?.removeAllRanges();
    sel?.addRange(range);
    component.onDialogSubmit();
    expect(component.insertHtml.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('onDialogSubmit emits attributeChange for th:unless with targetElement', () => {
    spyOn(component.attributeChange, 'emit');
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'th:unless';
    component.attributeValue = 'cond';
    component.targetElement = document.createElement('div');
    if (!document.body.contains(component.targetElement)) {
      document.body.appendChild(component.targetElement);
    }
    component.onDialogSubmit();
    expect(component.attributeChange.emit).toHaveBeenCalled();
    expect(component.closeDialog.emit).toHaveBeenCalled();
    document.body.removeChild(component.targetElement);
  });

  it('onDialogCancel resets state and emits closeDialog', () => {
    spyOn(component.closeDialog, 'emit');
    component.selectedAttribute = 'foo';
    component.attributeValue = 'bar';
    component.hrefValue = 'baz';
    component.onDialogCancel();
    expect(component.selectedAttribute).toBeNull();
    expect(component.attributeValue).toBe('');
    expect(component.hrefValue).toBe('');
    expect(component.closeDialog.emit).toHaveBeenCalled();
  });

  it('onMenuClose emits closeMenu', () => {
    spyOn(component.closeMenu, 'emit');
    component.onMenuClose();
    expect(component.closeMenu.emit).toHaveBeenCalled();
  });

  it('removeAttribute emits attributeChange and calls onMenuClose', () => {
    spyOn(component.attributeChange, 'emit');
    spyOn(component, 'onMenuClose');
    component.removeAttribute('th:text');
    expect(component.attributeChange.emit).toHaveBeenCalledWith({ attr: 'th:text', value: null });
    expect(component.onMenuClose).toHaveBeenCalled();
  });

  it('onContextMenuBackdropClick only closes if correct class', () => {
    spyOn(component, 'onMenuClose');
    const div = document.createElement('div');
    div.classList.add('thymeleaf-context-menu');
    const event = { target: div } as unknown as MouseEvent;
    component.onContextMenuBackdropClick(event);
    expect(component.onMenuClose).toHaveBeenCalled();
  });

  it('onAttrDialogBackdropClick only closes if correct class', () => {
    spyOn(component, 'onDialogCancel');
    const div = document.createElement('div');
    div.classList.add('thymeleaf-attr-dialog-backdrop');
    const event = { target: div } as unknown as MouseEvent;
    component.onAttrDialogBackdropClick(event);
    expect(component.onDialogCancel).toHaveBeenCalled();
  });
});

afterEach(() => {
  document.querySelectorAll('div').forEach(el => {
    if (el.parentNode === document.body) {
      el.remove();
    }
  });
});
