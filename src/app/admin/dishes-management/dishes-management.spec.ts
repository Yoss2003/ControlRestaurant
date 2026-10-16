import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DishesManagementComponent } from './dishes-management';
import { AdminService } from '../../services/admin.service';
import { of } from 'rxjs';

describe('DishesManagementComponent', () => {
  let component: DishesManagementComponent;
  let fixture: ComponentFixture<DishesManagementComponent>;

  const mockAdminService = {
    getDishes: () => of([]),
    getIngredients: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishesManagementComponent],
      providers: [
        { provide: AdminService, useValue: mockAdminService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DishesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});