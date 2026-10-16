import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-register.html',
  styleUrls: ['./cash-register.css']
})
export class CashRegisterComponent implements OnInit {
  isOpen: boolean = false;
  registerData: any = null;
  isLoading: boolean = true;
  
  // Formularios
  openingBalance: number | null = null;
  actualBalance: number | null = null;
  notes: string = '';

  // Notificaciones
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private adminService: AdminService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkStatus();
    } else {
      this.isLoading = false;
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  checkStatus(): void {
    this.isLoading = true;
    this.adminService.getCurrentCashRegister().subscribe({
      next: (res) => {
        this.isOpen = res.isOpen;
        this.registerData = res.isOpen ? res : null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al conectar con la caja.', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onOpenRegister(): void {
    if (this.openingBalance === null || this.openingBalance < 0) {
      this.showToast("Ingrese un monto inicial válido.", "error");
      return;
    }

    this.adminService.openCashRegister({ openingBalance: this.openingBalance }).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Caja abierta exitosamente.', 'success');
        this.openingBalance = null;
        this.checkStatus();
      },
      error: (err) => this.showToast(err.error?.message || 'Error al abrir caja.', 'error')
    });
  }

  onCloseRegister(): void {
    if (this.actualBalance === null || this.actualBalance < 0) {
      this.showToast("Ingrese el dinero físico contado.", "error");
      return;
    }

    this.adminService.closeCashRegister({ actualBalance: this.actualBalance, notes: this.notes }).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Caja cerrada exitosamente.', 'success');
        this.actualBalance = null;
        this.notes = '';
        this.checkStatus();
      },
      error: (err) => this.showToast(err.error?.message || 'Error al cerrar caja.', 'error')
    });
  }
}