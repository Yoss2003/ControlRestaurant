import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KitchenDisplayComponent } from './kitchen-display';
import { AdminService } from '../../services/admin.service';
import { Signalr } from '../../services/signalr';
import { of, Subject } from 'rxjs';

describe('KitchenDisplayComponent', () => {
  let component: KitchenDisplayComponent;
  let fixture: ComponentFixture<KitchenDisplayComponent>;

  const mockAdminService = {
    getKitchenOrders: () => of([])
  };

  const mockSignalr = {
    startConnection: () => {},
    orderUpdates$: new Subject().asObservable()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenDisplayComponent],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: Signalr, useValue: mockSignalr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});