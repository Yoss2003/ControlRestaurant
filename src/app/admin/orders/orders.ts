import { Component, OnInit, ChangeDetectorRef, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Signalr } from '../../services/signalr';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  tables: any[] = [];
  isLoading = true;

  // Variables para CREACIÓN MÚLTIPLE
  showModal = false;
  isEditing = false;
  editingTableId: number | null = null;
  
  tableQuantity = 1; // Cuántas mesas agregar
  newTablesConfig: { number: string, capacity: number }[] = []; // Configuración de cada nueva mesa
  
  // Variables de Edición (solo para editar una mesa existente)
  editTableNumber = '';
  editTableCapacity = 4;

  // Interacción con mesas
  selectedTable: any = null;
  showMenuModal = false;
  showOrderDetailsModal = false;

  // Notificaciones
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showDeleteModal = false;
  tableToDeleteId: number | null = null;

  // VARIABLES DEL MENÚ Y CARRITO
  dishes: any[] = [];
  cart: any[] = [];
  cartTotal: number = 0;

  //VARIABLES DE COBRO
  showCheckoutModal: boolean = false;
  selectedPaymentMethod: number = 1;

  //VARIABLES DE COBRO SEPARADOS
  isSplitBill: boolean = false;
  splitPayments: { methodId: number, amount: number }[] = [];

  activeOrderDetails: any = null;

  private signalrSubscription: Subscription | null = null;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private signalrService: Signalr,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTables();
      this.loadDishes();
      this.signalrService.startConnection();
      
      this.signalrSubscription = this.signalrService.orderUpdates$.subscribe((mensaje) => {
        if(mensaje === 'STATUS_UPDATE'){
          this.showToast('Estado de la orden actualizado.', 'success');
        }
        this.loadTables();
        if(this.showOrderDetailsModal && this.selectedTable){
          this.adminService.getActiveOrder(this.selectedTable.id).subscribe({
            next: (data) => {
              this.activeOrderDetails = data;
              this.cdr.detectChanges();
            },
            error: () => {
              this.showToast('No se pudo actualizar la cuenta de esta mesa.', 'error');
            }
          });
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.signalrSubscription) {
      this.signalrSubscription.unsubscribe();
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  loadTables() {
    this.isLoading = true;
    this.adminService.getTables().subscribe({
      next: (data) => {
        // Ordenamiento Alfanumérico (para que Mesa 10 vaya después de Mesa 9, no después de Mesa 1)
        this.tables = data.sort((a, b) => {
          return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar mesas:', err);
        this.showToast('Error al cargar las mesas del servidor.', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDishes() {
    this.adminService.getDishes().subscribe({
      next: (data: any) => {
        console.log('Datos crudos de platos:', data); // 👈 Revisa la consola (F12) con esto
        
        this.dishes = Array.isArray(data) ? data : (data.$values || data.data || data.items || []);
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar platos:', err);
        this.showToast('Error al cargar el menú.', 'error');
      }
    });
  }

  // =====================================
  // NUEVA LÓGICA DE AUTO-NOMBRAMIENTO
  // =====================================
  generateTableConfigs() {
    this.newTablesConfig = [];

    const activeNumbers = this.tables
      .map(t => {
        const match = t.number.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter(n => n !== null) as number[];

    let currentNumberToCheck = 1;

    for (let i = 0; i < this.tableQuantity; i++) {
      while (
        activeNumbers.includes(currentNumberToCheck) || 
        this.newTablesConfig.some(config => config.number === `Mesa ${currentNumberToCheck}`)
      ) {
        currentNumberToCheck++;
      }

      this.newTablesConfig.push({
        number: `Mesa ${currentNumberToCheck}`,
        capacity: 4 // Capacidad por defecto
      });

      currentNumberToCheck++;
    }
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingTableId = null;
    this.tableQuantity = 1;
    this.generateTableConfigs(); // Generamos la primera fila automáticamente
    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  openEditModal(table: any, event: Event) {
    event.stopPropagation();
    this.isEditing = true;
    this.editingTableId = table.id;
    this.editTableNumber = table.number;
    this.editTableCapacity = table.capacity;
    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  // Ahora el método de guardado es asíncrono para guardar las mesas en lote
  async saveTable() {
    if (this.isEditing && this.editingTableId) {
      // PROCESO DE EDICIÓN
      const payload = { number: this.editTableNumber, capacity: Number(this.editTableCapacity) };
      
      this.adminService.updateTable(this.editingTableId, payload).subscribe({
        next: () => {
          this.showModal = false;
          document.body.classList.remove('modal-open');
          this.showToast('Mesa actualizada correctamente.', 'success');
          this.loadTables();
        },
        error: (err) => this.showToast('Error al editar: ' + (err.error || err.message), 'error')
      });

    } else {
      // PROCESO DE CREACIÓN EN LOTE (MÚLTIPLES MESAS)
      try {
        for (const config of this.newTablesConfig) {
          // Convertimos la llamada Observable en una Promesa para esperar que termine cada una
          await new Promise<void>((resolve, reject) => {
            this.adminService.createTable(config).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          });
        }
        this.showModal = false;
        this.showToast(`${this.tableQuantity} mesas creadas correctamente.`, 'success');
        this.loadTables();
      } catch (err: any) {
        this.showToast('Error al crear mesas: ' + (err.error || err.message), 'error');
      }
    }
  }

  confirmDelete(id: number, event: Event) {
    event.stopPropagation(); 
    this.tableToDeleteId = id;
    this.showDeleteModal = true;
    document.body.classList.remove('modal-open');
  }

  executeDelete() {
    if (!this.tableToDeleteId) return;
    this.adminService.deleteTable(this.tableToDeleteId).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.tableToDeleteId = null;
        this.showToast('Mesa eliminada correctamente.', 'success');
        this.loadTables();
      },
      error: (err) => {
        this.showDeleteModal = false;
        this.showToast('No se puede eliminar: ' + (err.error?.message || err.error || err.message), 'error');
      }
    });
  }

  onTableClick(table: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.selectedTable = table;
    
    if (table.isAvailable) {
      this.showMenuModal = true;
      document.body.classList.add('modal-open'); 
    } else {
      // Si está ocupada, consulta el backend
      this.adminService.getActiveOrder(table.id).subscribe({
        next: (data) => {
          this.activeOrderDetails = data;
          this.showOrderDetailsModal = true;
          document.body.classList.add('modal-open'); 
          this.cdr.detectChanges();
        },
        error: () => {
             this.showToast('No se pudo cargar la cuenta de esta mesa.', 'error');
             document.body.classList.remove('modal-open'); 
        }
      });
    }
  }

  openCheckoutModal() {
    this.showOrderDetailsModal = false; // Cerramos el ticket
    this.showCheckoutModal = true;      // Abrimos la caja
    this.selectedPaymentMethod = 1;
    this.isSplitBill = false; 
    this.splitPayments = [];
  }

  confirmPayment() {
    if (!this.selectedTable || !this.activeOrderDetails) return;
    if (!this.canConfirmPayment) return; // Validación extra de seguridad

    let paymentData: any = {};

    // Construimos el DTO según cómo haya cobrado
    if (this.isSplitBill) {
      paymentData = {
        primaryPaymentMethodId: 0,
        totalAmountPaid: this.activeOrderDetails.totalAmount,
        splitPayments: this.splitPayments.map(p => ({
          paymentMethodId: p.methodId,
          amount: p.amount
        }))
      };
    } else {
      paymentData = {
        primaryPaymentMethodId: this.selectedPaymentMethod,
        totalAmountPaid: this.activeOrderDetails.totalAmount,
        splitPayments: []
      };
    }

    this.adminService.payOrder(this.selectedTable.id, paymentData).subscribe({
      next: () => {
        this.showToast('✅ Pago registrado y mesa liberada', 'success'); 
        this.showCheckoutModal = false;
        this.closeModals();
        this.loadTables(); 
      },
      error: (err: any) => {
        console.error(err);
        this.showToast('❌ Error al procesar el pago', 'error');
      }
    });
  }
  
  // ==========================================
  // LÓGICA DEL CARRITO (TOMA DE PEDIDOS)
  // ==========================================
  addToCart(dish: any) {
    const maxAvailable = dish.maxAvailable !== undefined ? dish.maxAvailable : 100; 
    const existingItem = this.cart.find(item => item.dishId === dish.id);
    
    if (existingItem) {
      if (existingItem.quantity >= maxAvailable) {
        this.showToast(`Solo hay ${maxAvailable} disponibles de ${dish.name}.`, 'error');
        return;
      }
      existingItem.quantity += 1;
      existingItem.subTotal = existingItem.quantity * existingItem.unitPrice;
    } else {
      if (maxAvailable <= 0) {
        this.showToast(`No hay stock suficiente para preparar ${dish.name}.`, 'error');
        return;
      }
      
      this.cart.push({
        dishId: dish.id,
        name: dish.name,
        unitPrice: dish.price,
        quantity: 1,
        subTotal: dish.price,
        notes: '',
        maxAvailable: maxAvailable
      });
    }
    this.updateCartTotal();
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    this.updateCartTotal();
  }

  updateQuantity(index: number, change: number) {
    const item = this.cart[index];
    const newQuantity = item.quantity + change;
    
    if (change > 0 && newQuantity > item.maxAvailable) {
      this.showToast(`Límite alcanzado. Solo puedes pedir ${item.maxAvailable} de ${item.name}.`, 'error');
      return;
    }

    item.quantity = newQuantity;
    
    if (item.quantity <= 0) {
      this.removeFromCart(index);
    } else {
      item.subTotal = item.quantity * item.unitPrice;
      this.updateCartTotal();
    }
  }

  updateCartTotal() {
    this.cartTotal = this.cart.reduce((sum, item) => sum + item.subTotal, 0);
  }

  submitOrder() {
    if (this.cart.length === 0) {
      this.showToast('El pedido está vacío. Agrega platos primero.', 'error');
      return;
    }

    const payload = {
      tableId: this.selectedTable.id,
      items: this.cart.map(item => ({
        dishId: item.dishId,
        quantity: item.quantity,
        notes: item.notes
      }))
    };

    this.adminService.createOrder(payload).subscribe({
      next: () => {
        this.showToast('¡Pedido enviado a cocina!', 'success');
        this.closeModals();
        this.loadTables(); // Recarga la mesa para que ahora aparezca OCUPADA (Roja)
      },
      error: (err) => {
        this.showToast('Error al enviar el pedido: ' + (err.error || err.message), 'error');
      }
    });
  }

  get checkoutButtonState(): 'IN_KITCHEN' | 'READY_TO_DELIVER' | 'CAN_PAY' {
    if (!this.activeOrderDetails || !this.activeOrderDetails.items) return 'IN_KITCHEN';
    
    // 1. Si hay al menos un plato cocinándose, bloqueamos todo
    const hasInKitchen = this.activeOrderDetails.items.some((i: any) => i.status === 'Pending' || i.status === 'Preparing');
    if (hasInKitchen) return 'IN_KITCHEN';
    
    // 2. Si la cocina terminó algo, pero el mesero no lo ha entregado
    const hasReady = this.activeOrderDetails.items.some((i: any) => i.status === 'Ready');
    if (hasReady) return 'READY_TO_DELIVER';
    
    // 3. Si no hay nada en cocina y nada pendiente de entregar, se puede cobrar
    return 'CAN_PAY';
  }

  handleMainAction() {
    const state = this.checkoutButtonState;
    
    if (state === 'READY_TO_DELIVER') {
      this.deliverReadyItems();
    } else if (state === 'CAN_PAY') {
      this.openCheckoutModal();
    }
  }

  deliverReadyItems() {
    // Filtramos los platos que la cocina ya marcó como "Servido"
    const itemsToDeliver = this.activeOrderDetails.items.filter((i: any) => i.status === 'Ready');
    if(itemsToDeliver.length === 0) return;
    
    // Preparamos las peticiones para cambiar su estado a "Delivered"
    const requests = itemsToDeliver.map((item: any) => 
      this.adminService.updateDetailStatus(item.detailId, 'Delivered')
    );
    
    forkJoin(requests).subscribe({
      next: () => {
        this.showToast('Platos marcados como entregados en la mesa.', 'success');
        // Recargamos la cuenta silenciosamente para que el botón se vuelva Verde
        this.adminService.getActiveOrder(this.selectedTable.id).subscribe(data => {
          this.activeOrderDetails = data;
          this.cdr.detectChanges();
        });
      },
      error: () => this.showToast('Error al actualizar entrega.', 'error')
    });
  }

  // ==========================================
  // LÓGICA MATEMÁTICA DE CAJA (CUENTAS DIVIDIDAS)
  // ==========================================
  get remainingAmount(): number {
    if (!this.activeOrderDetails || !this.isSplitBill) return 0;
    
    // Sumamos todo lo que el cajero ha ingresado en los inputs
    const totalPaid = this.splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    // Calculamos la diferencia
    return this.activeOrderDetails.totalAmount - totalPaid;
  }

  get absRemainingAmount(): number {
    return Math.abs(this.remainingAmount);
  }

  get canConfirmPayment(): boolean {
    if (!this.isSplitBill) return true; // Si es pago único, siempre cuadra
    
    // Si es pago dividido, el restante debe ser exactamente 0 (tolerancia para decimales)
    return Math.abs(this.remainingAmount) < 0.01;
  }

  setSplitBillMode(isSplit: boolean) {
    this.isSplitBill = isSplit;
    if (this.isSplitBill) {
      // Al cambiar a dividida, inicializa con 1 método cubriendo todo el monto
      this.splitPayments = [{ methodId: 1, amount: this.activeOrderDetails.totalAmount }];
    }
  }

  addSplitPayment() {
    // Agrega una nueva línea asumiendo el monto que falta pagar (si falta)
    const remaining = this.remainingAmount > 0 ? parseFloat(this.remainingAmount.toFixed(2)) : 0;
    this.splitPayments.push({ methodId: 1, amount: remaining });
  }

  removeSplitPayment(index: number) {
    this.splitPayments.splice(index, 1);
  }

  closeModals() {
    this.showMenuModal = false;
    this.showOrderDetailsModal = false;
    this.selectedTable = null;
    this.cart = []; // Limpiamos el carrito
    this.cartTotal = 0;
    document.body.classList.remove('modal-open');
  }
}