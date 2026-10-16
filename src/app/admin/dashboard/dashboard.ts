import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  metrics: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  // INYECTAMOS ChangeDetectorRef
  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMetrics();
    } else {
      this.isLoading = false; 
    }
  }

  loadMetrics() {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getDashboardMetrics().subscribe({
      next: (data: any) => {
        
        // Verificamos si el backend envolvió la respuesta
        const realData = data?.value || data?.data || data;

        if (realData) {
           this.metrics = realData;
        } else {
           this.errorMessage = 'El servidor no devolvió datos válidos.';
        }
        
        this.isLoading = false;
        
        // OBLIGAMOS A ANGULAR A REPINTAR LA PANTALLA
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar métricas:', err);
        let detalleError = err.message || 'Error desconocido';
        if(err.status === 404) detalleError = 'Endpoint no encontrado (404)';
        if(err.status === 500) detalleError = 'Error interno del servidor (500)';

        this.errorMessage = `Error: ${detalleError}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPercentage(amount: number): number {
    if (!this.metrics || !this.metrics.totalSales || this.metrics.totalSales === 0) return 0;
    return (amount / this.metrics.totalSales) * 100;
  }
}