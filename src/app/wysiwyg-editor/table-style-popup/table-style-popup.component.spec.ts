import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableStylePopupComponent } from './table-style-popup.component';

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
