import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersComponent } from './orders';
import { AdminService } from '../../services/admin.service';
import { Signalr } from '../../services/signalr';
import { of, Subject } from 'rxjs';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  const mockAdminService = {
    getTables: () => of([]),
    getDishes: () => of([])
  };

  const mockSignalr = {
    startConnection: () => {},
    orderUpdates$: new Subject().asObservable()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: Signalr, useValue: mockSignalr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});