import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  ingredients: any[] = [];
  filteredIngredients: any[] = []; 
  
  activeTab: string = 'Insumo';
  searchQuery: string = '';
  totalCapital: number = 0; 

  showModal = false;
  isEditing = false;
  currentIngredient: any = this.getEmptyIngredient();

  // VARIABLES PARA LA LÓGICA DE REPONER STOCK
  originalIngredient: any = null;
  addedStock: number | null = null;
  addedCost: number | null = null;

  showDeleteModal = false;
  itemToDelete: any = null;

  successMessage = '';
  errorMessage = '';

  totalCostInput: number | null = null;

  constructor(
    private adminService: AdminService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadIngredients();
    }
  }

  loadIngredients() {
    this.adminService.getIngredients().subscribe({
      next: (data) => {
        this.ingredients = (data || []).sort((a: any, b: any) => Number(a.id) - Number(b.id));
        this.filterData(); 
        this.calculateCapital(); 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error cargando inventario', err)
    });
  }

  calculateCapital() {
    this.totalCapital = 0;
    for (let item of this.ingredients) {
      let currentStock = item.currentStock || 0;
      let cost = item.unitCost || 0;
      this.totalCapital += (currentStock * cost);
    }
  }

  // CÁLCULO INTELIGENTE: COSTO PROMEDIO PONDERADO
  calculateUnitCost() {
    if (this.isEditing) {
      // Si estamos editando, usamos la fórmula del Costo Promedio Ponderado
      const oldStock = Number(this.originalIngredient.currentStock) || 0;
      const oldUnitCost = Number(this.originalIngredient.unitCost) || 0;
      const oldTotalValue = oldStock * oldUnitCost;

      const newStock = Number(this.addedStock) || 0;
      const newCost = Number(this.addedCost) || 0;

      const finalStock = oldStock + newStock;

      if (finalStock > 0) {
        this.currentIngredient.currentStock = finalStock;
        // Nuevo Costo = (Valor Viejo + Valor Nuevo) / Stock Total
        this.currentIngredient.unitCost = (oldTotalValue + newCost) / finalStock;
      } else {
        // Si no agregó nada, se mantiene igual
        this.currentIngredient.currentStock = oldStock;
        this.currentIngredient.unitCost = oldUnitCost;
      }

    } else {
      // Lógica sencilla para insumo totalmente nuevo
      const stock = Number(this.currentIngredient.currentStock) || 0;
      const cost = Number(this.totalCostInput) || 0;

      if (stock > 0 && cost > 0) {
        this.currentIngredient.unitCost = cost / stock;
      } else {
        this.currentIngredient.unitCost = 0;
      }
    }
  }

  setTab(tabName: string) {
    this.activeTab = tabName;
    this.filterData();
  }

  filterData() {
    this.filteredIngredients = this.ingredients.filter(item => {
      const cat = item.category || 'Insumo';
      const matchesTab = cat === this.activeTab;
      const matchesSearch = item.name ? item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) : false;
      return matchesTab && matchesSearch;
    });
  }

  getEmptyIngredient() {
    return { 
      name: '', category: '', unitOfMeasure: '', currentStock: null, minimumStock: null, 
      unitCost: null, isPerishable: false, expirationDate: null
    };
  }

  onCategoryChange() {
    if (this.currentIngredient.category === 'Utensilio') {
      this.currentIngredient.unitOfMeasure = 'und';
    } else {
      this.currentIngredient.unitOfMeasure = 'kg';
    }
  }

  openModal() {
    this.isEditing = false;
    this.currentIngredient = this.getEmptyIngredient();
    this.totalCostInput = null; 
    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  editIngredient(item: any) {
    this.isEditing = true;
    
    // Clonamos el insumo original para no perder los datos reales
    this.originalIngredient = { ...item };
    this.currentIngredient = { ...item };

    // SOLUCIÓN A LA FECHA: Cortamos el "T00:00:00" para que el HTML lo lea
    if (this.currentIngredient.expirationDate) {
      this.currentIngredient.expirationDate = this.currentIngredient.expirationDate.split('T')[0];
    }

    // Reiniciamos los casilleros de compra nueva a vacío
    this.addedStock = null;
    this.addedCost = null;

    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.showModal = false;
    document.body.classList.remove('modal-open');
  }

  confirmDelete(item: any) {
    this.itemToDelete = item;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
    document.body.classList.remove('modal-open');
  }

  isDeleting = false;

  executeDelete() {
    if (!this.itemToDelete || this.isDeleting) return; 
    this.isDeleting = true;

    this.adminService.deleteIngredient(this.itemToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Elemento eliminado exitosamente.';
        this.showDeleteModal = false;
        this.itemToDelete = null;
        this.isDeleting = false;
        this.finalizeSave();
      },
      error: () => {
        this.showError('Error al eliminar el elemento.');
        this.showDeleteModal = false;
        this.isDeleting = false;
      }
    });
  }

  isSaving = false;

  saveIngredient() {
    if (!this.currentIngredient.name || !this.currentIngredient.category || !this.currentIngredient.unitOfMeasure) {
       this.showError('Por favor complete los campos obligatorios (Nombre, Categoría y Unidad).');
       return;
    }
    
    if (this.isSaving) return;
    this.isSaving = true;

    let fechaSegura = this.currentIngredient.expirationDate;
    if (!this.currentIngredient.isPerishable || fechaSegura === '') {
        fechaSegura = null;
    }

    const payloadParaNET = {
      name: this.currentIngredient.name,
      category: this.currentIngredient.category,
      baseUnit: this.currentIngredient.unitOfMeasure, 
      initialStock: Number(this.currentIngredient.currentStock) || 0, 
      initialCost: Number(this.currentIngredient.unitCost) || 0,   
      minimumStock: Number(this.currentIngredient.minimumStock) || 0,
      isPerishable: Boolean(this.currentIngredient.isPerishable),
      expirationDate: fechaSegura
    };

    const request = this.isEditing 
      ? this.adminService.updateIngredient(this.currentIngredient.id, payloadParaNET)
      : this.adminService.createIngredient(payloadParaNET);

    request.subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'Elemento actualizado correctamente.' : 'Elemento registrado correctamente.';
        this.isSaving = false; 
        this.finalizeSave();
      },
      error: (err) => {
        console.error("Error del backend:", err);
        this.showError('Error al procesar la solicitud.');
        this.isSaving = false; 
      }
    });
  }

  private finalizeSave() {
    this.loadIngredients();
    this.closeModal();
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
}