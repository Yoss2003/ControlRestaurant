import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CashRegisterComponent } from './cash-register';
import { AdminService } from '../../services/admin.service';
import { of } from 'rxjs';

describe('CashRegisterComponent', () => {
  let component: CashRegisterComponent;
  let fixture: ComponentFixture<CashRegisterComponent>;

  const mockAdminService = {
    getCurrentCashRegister: () => of({ isOpen: false })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashRegisterComponent],
      providers: [
        { provide: AdminService, useValue: mockAdminService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CashRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});