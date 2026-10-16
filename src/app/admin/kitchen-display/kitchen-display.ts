import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Signalr } from '../../services/signalr';
import { forkJoin, Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen-display.html',
  styleUrls: ['./kitchen-display.css']
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  pendingOrders: any[] = [];
  preparingOrders: any[] = [];
  refreshInterval: any;
  private signalRSubscription!: Subscription;

  constructor(
    private adminService: AdminService, 
    private cdr: ChangeDetectorRef, 
    private signalrService: Signalr,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadOrders();
      this.signalrService.startConnection();
      this.signalRSubscription = this.signalrService.orderUpdates$.subscribe((mensaje) => {
        this.loadOrders();
      });
    }
  }

  ngOnDestroy() {
    if (this.signalRSubscription) {
      this.signalRSubscription.unsubscribe();
    }
  }

  loadOrders() {
    this.adminService.getKitchenOrders().subscribe({
      next: (data) => {
        // Procesamos la data para separar los principales de los adicionales
        const processedOrders = data.map(o => {
          const mainItems = o.details.filter((d: any) => !d.isAdicional);
          const adicionalItems = o.details.filter((d: any) => d.isAdicional);
          
          // Si la orden tiene al menos un plato pendiente, se va a la columna 1
          const isPending = o.details.some((d: any) => d.status === 'Pending');
          
          return {
            ...o,
            mainItems,
            adicionalItems,
            isPending,
            showAdicionales: false // Controla si el acordeón está abierto o cerrado
          };
        });

        // Repartimos en las dos columnas
        this.pendingOrders = processedOrders.filter(o => o.isPending);
        this.preparingOrders = processedOrders.filter(o => !o.isPending);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando el KDS", err)
    });
  }

  changeOrderStatus(order: any, newStatus: string) {
    // Busca todos los platos de la orden que necesitan avanzar de estado
    const itemsToUpdate = order.details.filter((d: any) => d.status !== newStatus && d.status !== 'Ready');
    
    if (itemsToUpdate.length === 0) return;

    // Prepara todas las peticiones al backend
    const requests = itemsToUpdate.map((item: any) => 
      this.adminService.updateDetailStatus(item.detailId, newStatus)
    );

    // forkJoin ejecuta todas las peticiones en paralelo y espera a que terminen
    forkJoin(requests).subscribe({
      next: () => this.loadOrders(), // Recargamos las columnas
      error: (err) => console.error("Error actualizando estados", err)
    });
  }
}