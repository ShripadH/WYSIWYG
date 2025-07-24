// All tests commented out for npm packaging
import { TestBed } from '@angular/core/testing';

import { ThymeleafRenderService } from './services/thymeleaf-render.service';

describe('ThymeleafRenderService', () => {
  let service: ThymeleafRenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThymeleafRenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should render template with th:text', () => {
    const html = '<span th:text="${user.name}">Name</span>';
    const data = { user: { name: 'Alice' } };
    const result = service.renderTemplate(html, data);
    expect(result).toContain('Alice');
    expect(result).not.toContain('th:text');
  });

  it('should render template with th:if (true)', () => {
    const html = '<div th:if="${user.active}">Active</div>';
    const data = { user: { active: true } };
    const result = service.renderTemplate(html, data);
    expect(result).toContain('Active');
  });

  it('should render template with th:if (false)', () => {
    const html = '<div th:if="${user.active}">Active</div>';
    const data = { user: { active: false } };
    const result = service.renderTemplate(html, data);
    expect(result).not.toContain('Active');
  });

  it('should render template with th:unless (true)', () => {
    const html = '<div th:unless="${user.active}">Inactive</div>';
    const data = { user: { active: true } };
    const result = service.renderTemplate(html, data);
    expect(result).not.toContain('Inactive');
  });

  it('should render template with th:unless (false)', () => {
    const html = '<div th:unless="${user.active}">Inactive</div>';
    const data = { user: { active: false } };
    const result = service.renderTemplate(html, data);
    expect(result).toContain('Inactive');
  });

  it('should render template with th:each', () => {
    const html = '<ul><li th:each="user : ${users}" th:text="${user.name}">Name</li></ul>';
    const data = { users: [{ name: 'A' }, { name: 'B' }] };
    const result = service.renderTemplate(html, data);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('should render template with th:remove', () => {
    const html = '<div th:remove>Remove me</div><span>Keep me</span>';
    const data = {};
    const result = service.renderTemplate(html, data);
    expect(result).not.toContain('Remove me');
    expect(result).toContain('Keep me');
  });

  it('should evaluate expressions with evalExpr', () => {
    expect((service as any).evalExpr('${user.name}', { user: { name: 'X' } })).toBe('X');
    expect((service as any).evalExpr('"Hello"', {})).toBe('Hello');
    expect((service as any).evalExpr('user.name', { user: { name: 'Y' } })).toBe('Y');
  });

  it('should resolve path with resolvePath', () => {
    expect((service as any).resolvePath({ a: { b: { c: 1 } } }, 'a.b.c')).toBe(1);
    expect((service as any).resolvePath({ a: 2 }, 'a')).toBe(2);
    expect((service as any).resolvePath({}, 'x')).toBeUndefined();
  });

  it('should handle confirmThymeleafDialog with no savedRange', () => {
    service.savedRange = null;
    service.showThymeleafDialog = true;
    service.confirmThymeleafDialog(document.createElement('div'), () => {});
    expect(service.showThymeleafDialog).toBe(false);
  });

  it('should handle cancelThymeleafDialog', () => {
    service.showThymeleafDialog = true;
    service.cancelThymeleafDialog();
    expect(service.showThymeleafDialog).toBe(false);
  });

  it('should handle onThymeleafMenuClose', () => {
    service.showThymeleafMenu = true;
    service.onThymeleafMenuClose();
    expect(service.showThymeleafMenu).toBe(false);
  });

  it('should handle onThymeleafCloseDialog', () => {
    service.showThymeleafAttrDialog = true;
    service.onThymeleafCloseDialog();
    expect(service.showThymeleafAttrDialog).toBe(false);
  });

  it('should handle onThymeleafAttributeChange', () => {
    const updateHtml = jasmine.createSpy('updateHtml');
    service.onThymeleafAttributeChange({ attr: 'th:text', value: 'test' }, updateHtml);
    expect(updateHtml).toHaveBeenCalled();
  });

  it('should handle updateThymeleafHandles', () => {
    const editor = document.createElement('div');
    const wrapper = document.createElement('div');
    const ngZone = { run: (fn: any) => fn(), runOutsideAngular: (fn: any) => fn() };
    const cdr = { markForCheck: () => {} };
    expect(() => service.updateThymeleafHandles(editor, wrapper, ngZone, cdr)).not.toThrow();
  });

  it('should handle onThymeleafEachEditHandleClick', () => {
    const wrapper = document.createElement('div');
    expect(() => service.onThymeleafEachEditHandleClick(wrapper)).not.toThrow();
  });

  it('should handle onThymeleafEachEditHandleClickForTable', () => {
    const table = document.createElement('table');
    const wrapper = document.createElement('div');
    const cdr = { markForCheck: () => {}, detectChanges: () => {} };
    expect(() => service.onThymeleafEachEditHandleClickForTable(table, wrapper, cdr)).not.toThrow();
  });

  it('should handle saveThymeleafEachEdit', () => {
    const updateHtml = jasmine.createSpy('updateHtml');
    expect(() => service.saveThymeleafEachEdit(updateHtml)).not.toThrow();
  });

  it('should handle onEditorMouseOver and onEditorMouseOut', () => {
    const mockTarget = { closest: () => null };
    const event = { target: mockTarget } as any;
    const wrapper = document.createElement('div');
    expect(() => service.onEditorMouseOver(event, wrapper)).not.toThrow();
    expect(() => service.onEditorMouseOut(event)).not.toThrow();
  });

  it('should handle onEditorContextMenu', () => {
    const event = new MouseEvent('contextmenu');
    const updateHtml = jasmine.createSpy('updateHtml');
    expect(() => service.onEditorContextMenu(event, updateHtml)).not.toThrow();
  });

  it('should handle onInsertHtml', () => {
    const html = '<div>test</div>';
    const editor = document.createElement('div');
    const wrapper = document.createElement('div');
    const ngZone = { run: (fn: any) => fn(), runOutsideAngular: (fn: any) => fn() };
    const cdr = { markForCheck: () => {} };
    const updateHtml = jasmine.createSpy('updateHtml');
    const injectTableResizeHandles = jasmine.createSpy('injectTableResizeHandles');
    expect(() => service.onInsertHtml(html, editor, wrapper, ngZone, cdr, updateHtml, injectTableResizeHandles)).not.toThrow();
  });
});
