import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KitchenDisplay } from './kitchen-display';

describe('KitchenDisplay', () => {
  let component: KitchenDisplay;
  let fixture: ComponentFixture<KitchenDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
