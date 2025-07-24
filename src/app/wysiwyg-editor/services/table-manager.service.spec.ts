// All tests commented out for npm packaging
import { TableManagerService } from './table-manager.service';

// Utility function to check if a value is a valid DOM element
function isDomElement(el: any): el is Element {
  return el instanceof Element;
}

describe('TableManagerService', () => {
  let service: TableManagerService;

  beforeEach(() => {
    service = new TableManagerService();
  });

  function createTable(cols = 3, rows = 2) {
    const table = document.createElement('table');
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        td.textContent = `${r},${c}`;
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    // Ensure table is attached to body for all tests
    if (document.body && !document.body.contains(table) && isDomElement(table)) {
      document.body.appendChild(table);
    }
    return table;
  }

  afterEach(() => {
    if (document.body) {
      document.querySelectorAll('table').forEach(el => {
        if (el.parentNode === document.body && isDomElement(el)) {
          el.remove();
        }
      });
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should inject resize handles into table', () => {
    const table = createTable();
    const editor = document.createElement('div');
    editor.appendChild(table);
    const startColResize = jasmine.createSpy('startColResize');
    service.injectTableResizeHandles(editor, startColResize);
    const handles = table.querySelectorAll('.col-resize-handle');
    expect(handles.length).toBeGreaterThan(0);
    handles[0].dispatchEvent(new MouseEvent('mousedown'));
    expect(startColResize).toHaveBeenCalled();
  });

  it('should start and end column resize', () => {
    const table = createTable();
    const colIndex = 1;
    const onMove = jasmine.createSpy('onMove');
    const onEnd = jasmine.createSpy('onEnd');
    service.startColResize(new MouseEvent('mousedown', { clientX: 100 }), table, colIndex, onMove, onEnd);
    expect((service as any).resizingCol).toBeTrue();
    expect((service as any).resizeColIndex).toBe(colIndex);
    expect((service as any).currentTable).toBe(table);
    // Simulate move
    service.onColResizeMove(new MouseEvent('mousemove', { clientX: 120 }));
    // Simulate end
    service.onColResizeEnd(onEnd);
    expect((service as any).resizingCol).toBeFalse();
    expect(onEnd).toHaveBeenCalled();
  });

  it('should handle table height resize', () => {
    const table = createTable();
    service.startTableHeightResize(new MouseEvent('mousedown', { clientY: 100 }), table);
    expect((service as any).resizingTableHeight).toBeTrue();
    expect((service as any).currentHeightTable).toBe(table);
    // Simulate move
    service.onTableHeightResizeMove(new MouseEvent('mousemove', { clientY: 120 }));
    expect(table.style.height).toBeDefined();
    // Simulate end
    service.onTableHeightResizeEnd(new MouseEvent('mouseup'));
    expect((service as any).resizingTableHeight).toBeFalse();
    expect((service as any).currentHeightTable).toBeNull();
  });

  it('should handle row height resize', () => {
    const table = createTable();
    const row = table.rows[0];
    service.startRowHeightResize(new MouseEvent('mousedown', { clientY: 100 }), row);
    expect((service as any).resizingRowHeight).toBeTrue();
    expect((service as any).currentHeightRow).toBe(row);
    // Simulate move
    service.onRowHeightResizeMove(new MouseEvent('mousemove', { clientY: 120 }));
    expect(row.style.height).toBeDefined();
    // Simulate end
    service.onRowHeightResizeEnd(new MouseEvent('mouseup'));
    expect((service as any).resizingRowHeight).toBeFalse();
    expect((service as any).currentHeightRow).toBeNull();
  });

  it('should not throw if onColResizeMove called when not resizing', () => {
    expect(() => service.onColResizeMove(new MouseEvent('mousemove'))).not.toThrow();
  });

  it('should not throw if onTableHeightResizeMove called when not resizing', () => {
    expect(() => service.onTableHeightResizeMove(new MouseEvent('mousemove'))).not.toThrow();
  });

  it('should not throw if onRowHeightResizeMove called when not resizing', () => {
    expect(() => service.onRowHeightResizeMove(new MouseEvent('mousemove'))).not.toThrow();
  });
}); 