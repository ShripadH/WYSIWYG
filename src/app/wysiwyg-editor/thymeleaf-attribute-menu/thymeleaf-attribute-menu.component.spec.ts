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
});
