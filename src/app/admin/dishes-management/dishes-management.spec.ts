import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DishesManagementComponent } from './dishes-management';

describe('DishesManagementComponent', () => {
  let component: DishesManagementComponent;
  let fixture: ComponentFixture<DishesManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishesManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DishesManagementComponent );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
