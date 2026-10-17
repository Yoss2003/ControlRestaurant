import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-dishes-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dishes-management.html',
  styleUrls: ['./dishes-management.css']
})
export class DishesManagementComponent implements OnInit {
  dishes: any[] = [];
  availableIngredients: any[] = []; 
  allowedUnits = ['kg', 'l', 'und', 'g', 'ml'];

  selectedDish: any = null;
  isCreatingDish = false;
  isLoadingDishes = true;
  
  newDish = { name: '', category: 'Platos de Fondo', price: null as number | null };
  recipePayload = { dishId: 0, yieldPortions: 1, items: [] as any[] };

  successMessage = '';
  errorMessage = '';

  // --- VARIABLES DE ANÁLISIS FINANCIERO ---
  liveRecipeCost = 0;
  suggestedPrice = 0;
  currentMargin = 0;
  marginStatus = '';
  marginColor = '';

  // --- VARIABLES PARA EL MODAL RÁPIDO ---
  showIngredientModal = false;
  isSavingQuickIngredient = false;
  isEditingQuickIngredient = false;
  editingIngredientId: number | null = null;
  isSavingDish = false;
  
  // --- VARIABLES PARA EL MODAL DE REQUERIMIENTOS DE COCINA ---
  showShoppingModal = false;
  shoppingListItems: any[] = [];

  // --- VARIABLES PARA EL MODAL DE EQUIVALENCIAS ---
  showEquivalenceModal = false;

  newQuickIngredient: any = { 
    name: '', category: 'Insumo', baseUnit: '', 
    initialStock: null, minimumStock: null, totalCost: null, 
    isPerishable: false, expirationDate: null 
  };

  // INYECTAMOS EL ChangeDetectorRef COMO EN TU INVENTARIO
  constructor(
    private adminService: AdminService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDishes();
      this.loadRealIngredients();
    } else {
      this.isLoadingDishes = false;
    }
  }

  loadDishes() {
    this.isLoadingDishes = true;
    this.adminService.getDishes().subscribe({
      next: (data: any) => {
        let rawArray = Array.isArray(data) ? data : (data?.$values || data?.data || data?.items || []);
        
        this.dishes = (rawArray || []).sort((a: any, b: any) => {
           const idA = a.id || a.Id || 0;
           const idB = b.id || b.Id || 0;
           return idA - idB;
        });

        this.isLoadingDishes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando platos', err);
        this.isLoadingDishes = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRealIngredients() {
    this.adminService.getIngredients().subscribe({
      next: (data: any) => {
        if (data) {
          let rawArray = Array.isArray(data) ? data : (data?.$values || data?.data || data?.items || []);
          
          this.availableIngredients = (rawArray || [])
            .filter((item: any) => item.category === 'Insumo' || !item.category)
            .map((item: any) => {
               let u = (item.unitOfMeasure || '').toLowerCase();
               if (u === 'unidades') u = 'und';
               item.unitOfMeasure = u;
               return item;
            })
            .sort((a: any, b: any) => {
               const idA = Number(a.id || a.Id || 0);
               const idB = Number(b.id || b.Id || 0);
               return idA - idB;
            });
            
          this.calculateAnalysis(); 
          this.cdr.detectChanges(); 
        }
      },
      error: (err) => console.error('Error cargando catálogo de ingredientes', err)
    });
  }

  calculateAnalysis(source: string = 'ingredients') {
    let totalRecipeCost = 0;
    const portions = Math.max(1, Number(this.recipePayload.yieldPortions) || 1);

    for (let item of this.recipePayload.items) {
      if (item.ingredientId && item.totalQuantity) {
        let ing = this.availableIngredients.find(x => x.id === item.ingredientId);
        if (ing) {
          let convertedQty = this.convertQuantity(item.totalQuantity, item.unit, ing.unitOfMeasure);
          let cost = ing.unitCost || ing.initialCost || 0;
          totalRecipeCost += convertedQty * cost;
        }
      }
    }

    // RC16: Dividimos el costo total de la receta entre las porciones que rinde
    this.liveRecipeCost = totalRecipeCost / portions;
    this.suggestedPrice = this.liveRecipeCost > 0 ? this.liveRecipeCost / 0.33 : 0;

    if (source === 'ingredients' && this.isCreatingDish && !this.newDish.price) {
      if (this.suggestedPrice > 0) {
        this.newDish.price = Number(this.suggestedPrice.toFixed(2));
      }
    }

    let sellPrice = this.newDish.price || 0;
    if (sellPrice > 0 && this.liveRecipeCost > 0) {
      this.currentMargin = ((sellPrice - this.liveRecipeCost) / sellPrice) * 100;
    } else {
      this.currentMargin = 0;
    }

    if (sellPrice <= 0 || this.liveRecipeCost <= 0) {
      this.marginStatus = 'Esperando datos...';
      this.marginColor = '#64748b';
    } else if (this.currentMargin >= 65) {
      this.marginStatus = 'Excelente Ganancia';
      this.marginColor = '#10b981';
    } else if (this.currentMargin >= 45) {
      this.marginStatus = 'Margen Aceptable';
      this.marginColor = '#f59e0b';
    } else {
      this.marginStatus = 'Peligro (Pérdida/Bajo)';
      this.marginColor = '#ef4444';
    }
  }

  getMaxCookablePortions(dish: any): { available: number, target: number } {
    let target = (this.selectedDish && this.selectedDish.id === dish.id) ? this.recipePayload.yieldPortions : 1;
    if (target <= 0) target = 1;

    if (!this.selectedDish || this.selectedDish.id !== dish.id || this.recipePayload.items.length === 0) {
      return { available: 0, target: target };
    }

    let minPortionsPossible = Infinity; 

    for (let item of this.recipePayload.items) {
      if (!item.ingredientId || !item.totalQuantity) continue;

      let ing = this.availableIngredients.find(x => x.id === item.ingredientId);
      if (!ing) {
        minPortionsPossible = 0;
        break;
      }

      let convertedTotal = this.convertQuantity(item.totalQuantity, item.unit, ing.unitOfMeasure);
      if (convertedTotal <= 0) continue;

      let requiredPerPlate = convertedTotal / target;       
      let currentStock = ing.currentStock || 0;      
      let possibleWithThisIng = Math.floor(currentStock / requiredPerPlate);

      if (possibleWithThisIng < minPortionsPossible) {
        minPortionsPossible = possibleWithThisIng;
      }
    }

    if (minPortionsPossible === Infinity) {
        minPortionsPossible = 0;
    }

    let available = Math.max(0, minPortionsPossible);
    
    return { available, target };
  }

  getIngredientName(id: number): string {
    const ing = this.availableIngredients.find(x => x.id === id);
    return ing ? ing.name : 'Desconocido';
  }

  getIngredientCost(ingredientId: number): number {
    if (!ingredientId) return 0;
    const ing = this.availableIngredients.find(x => x.id === ingredientId);
    return ing ? (ing.unitCost || ing.initialCost || 0) : 0;
  }

  private convertQuantity(quantity: number, recipeUnit: string, inventoryUnit: string): number {
    if (!quantity || !recipeUnit || !inventoryUnit) return quantity || 0;
    let rUnit = recipeUnit.trim().toLowerCase();
    let iUnit = inventoryUnit.trim().toLowerCase();

    if (rUnit === iUnit) return quantity;
    if ((rUnit === 'g' && iUnit === 'kg') || (rUnit === 'ml' && iUnit === 'l')) return quantity / 1000;
    if ((rUnit === 'kg' && iUnit === 'g') || (rUnit === 'l' && iUnit === 'ml')) return quantity * 1000;

    console.warn(`Conversión rechazada: Incompatible de ${rUnit} a ${iUnit}`);
    return 0;
  }

  // --- GESTIÓN DE PLATOS ---
  startCreatingDish() {
    this.isCreatingDish = true;
    this.selectedDish = null;
    this.newDish = { name: '', category: 'Platos de Fondo', price: null };
    this.recipePayload = { dishId: 0, yieldPortions: 1, items: [] };
    this.calculateAnalysis();
    this.clearMessages();
  }

  selectDish(dish: any) {
    this.isCreatingDish = false;
    this.selectedDish = dish;
    
    this.newDish = { 
      name: dish.name, 
      category: dish.category || 'Platos de Fondo', 
      price: Number(dish.price) || null
    };
    
    this.recipePayload = { dishId: dish.id, yieldPortions: 1, items: [] };
    this.calculateAnalysis('load'); 
    this.clearMessages();

    this.adminService.getRecipe(dish.id).subscribe({
      next: (recipeData) => {
        if (recipeData && recipeData.items && recipeData.items.length > 0) {
          
          // TRADUCTOR AUTOMÁTICO Y ADAPTADOR VISUAL PARA EL CHEF
          recipeData.items.forEach((item: any) => {
             let u = (item.unit || '').toLowerCase();
             if (u === 'unidades') u = 'und';

             // --- MAGIA VISUAL: Si está en kg o litros y es menos de 1, lo pasamos a g / ml ---
             if (u === 'kg' && item.totalQuantity > 0 && item.totalQuantity < 1) {
                 item.totalQuantity = Number((item.totalQuantity * 1000).toFixed(3));
                 u = 'g';
             } 
             else if (u === 'l' && item.totalQuantity > 0 && item.totalQuantity < 1) {
                 item.totalQuantity = Number((item.totalQuantity * 1000).toFixed(3));
                 u = 'ml';
             }

             item.unit = u;
          });

          this.recipePayload = recipeData;
          this.calculateAnalysis('load');
          this.cdr.detectChanges(); 
        }
      },
      error: (err) => {
        console.error("Error obteniendo la receta:", err);
      }
    });
  }

  addIngredientRow() {
    if (this.recipePayload.items.length < 15) {
      this.recipePayload.items.push({ 
        ingredientId: this.availableIngredients.length > 0 ? this.availableIngredients[0].id : null, 
        totalQuantity: null,
        unit: 'g' 
      });
      this.calculateAnalysis();
    }
  }

  removeIngredientRow(index: number) {
    this.recipePayload.items.splice(index, 1);
    this.calculateAnalysis();
  }

  changeYield(amount: number) {
    let newYield = this.recipePayload.yieldPortions + amount;
    this.recipePayload.yieldPortions = newYield > 1 ? newYield : 1;
    this.calculateAnalysis();
  }

  saveFullDish() {
    if (!this.newDish.name || !this.newDish.price) return;
    if (this.isSavingDish) return;
    
    this.isSavingDish = true;
    this.clearMessages();

    const request = this.isCreatingDish 
      ? this.adminService.createDish(this.newDish)
      : this.adminService.updateDish(this.selectedDish.id, this.newDish);

    request.subscribe({
      next: (responseDish: any) => {
        const currentDishId = this.isCreatingDish ? responseDish.id : this.selectedDish.id;
        
        const itemsValidos = this.recipePayload.items.filter((item: any) => item.ingredientId && item.totalQuantity > 0);
        
        const payloadReceta = {
          dishId: currentDishId,
          yieldPortions: Number(this.recipePayload.yieldPortions) || 1,
          items: itemsValidos
        };

        this.adminService.assignRecipe(payloadReceta).subscribe({
          next: () => {
            this.successMessage = 'Plato y receta guardados con éxito.';
            this.finalizeSave();
          },
          error: () => {
            this.showError('Plato guardado, pero falló la actualización de la receta.');
            this.isSavingDish = false; 
          }
        });
      },
      error: () => {
        this.showError('Error al guardar el plato en el servidor.');
        this.isSavingDish = false; 
      }
    });
  }

  private finalizeSave() {
    this.loadDishes();
    this.isCreatingDish = false;
    this.selectedDish = null; 
    this.isSavingDish = false; 
    this.cdr.detectChanges(); 

    setTimeout(() => { 
      this.successMessage = ''; 
      this.cdr.detectChanges(); 
    }, 4000);
  }

  // -- MODAL DE EQUIVALENCIAS --
  openEquivalenceModal() {
    this.showEquivalenceModal = true;
    document.body.classList.add('modal-open');
  }

  closeEquivalenceModal() {
    this.showEquivalenceModal = false;
    document.body.classList.remove('modal-open');
  }

  // -- MODAL DE INGREDIENTES --
  openShoppingModal(event?: Event) {
    document.body.classList.add('modal-open');
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.adminService.getShoppingList().subscribe({
      next: (data) => {
        this.shoppingListItems = data;
        this.showShoppingModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar la lista de compras', err)
    });
  }

  closeShoppingModal() {
    this.showShoppingModal = false;
    document.body.classList.remove('modal-open');
  }

  // Filtra y obtiene solo los insumos que están por debajo del stock mínimo (los que faltan)
  getMissingIngredients() {
    return this.availableIngredients.filter(ing => {
      let current = ing.currentStock || 0;
      let minimum = ing.minimumStock || 0;
      return minimum > 0 && current < minimum;
    });
  }

  // Calcula la cantidad exacta que falta comprar (Stock Mínimo - Stock Actual)
  getShoppingQuantity(ing: any): number {
    let current = ing.currentStock || 0;
    let minimum = ing.minimumStock || 0;
    return Number((minimum - current).toFixed(3));
  }

    // Calcula el costo aproximado de lo que falta comprar de ese insumo  
  getShoppingItemCost(ing: any): number {
    let missingQty = this.getShoppingQuantity(ing);
    let unitCost = ing.unitCost || ing.initialCost || 0;
    return Number((missingQty * unitCost).toFixed(2));
  }

  // Suma el costo total de todos los insumos faltantes en la lista de compras
  getTotalShoppingCost(): number {
    return this.shoppingListItems.reduce((acc, item) => acc + item.estimatedCost, 0);
  }

  // --- MODAL RÁPIDO ---
  openIngredientModal() {
    this.resetQuickForm();
    this.showIngredientModal = true;
    document.body.classList.add('modal-open');
  }

  closeIngredientModal() {
    this.showIngredientModal = false;
    document.body.classList.remove('modal-open');
  }

  resetQuickForm() {
    this.isEditingQuickIngredient = false;
    this.editingIngredientId = null;
    this.newQuickIngredient = { 
      name: '', category: 'Insumo', baseUnit: '', 
      initialStock: null, minimumStock: null, totalCost: null, 
      isPerishable: false, expirationDate: null 
    };
  }

  editQuickIngredient(ing: any) {
    this.isEditingQuickIngredient = true;
    this.editingIngredientId = ing.id;
    
    let stock = ing.currentStock || 0;
    let cost = ing.unitCost || 0;

    this.newQuickIngredient = {
      name: ing.name,
      category: ing.category || 'Insumo',
      baseUnit: ing.unitOfMeasure,
      initialStock: ing.currentStock,
      minimumStock: ing.minimumStock,
      totalCost: stock > 0 ? (stock * cost) : cost,
      isPerishable: ing.isPerishable,
      expirationDate: ing.expirationDate ? ing.expirationDate.split('T')[0] : null
    };
  }

  deleteQuickIngredient(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este insumo?')) {
      this.adminService.deleteIngredient(id).subscribe({
        next: () => {
          this.successMessage = 'Insumo eliminado exitosamente.';
          this.loadRealIngredients(); // Refresca la lista
          if (this.editingIngredientId === id) this.resetQuickForm(); // Limpia si estaba editando ese mismo
          setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: () => this.showError('Error al eliminar el insumo.')
      });
    }
  }

  saveQuickIngredient() {
    if (!this.newQuickIngredient.name || !this.newQuickIngredient.baseUnit) {
      this.showError('Complete los campos obligatorios (Nombre y Unidad).');
      return;
    }

    if (this.isSavingQuickIngredient) return; 
    this.isSavingQuickIngredient = true;

    let fechaSegura = this.newQuickIngredient.expirationDate;
    if (!this.newQuickIngredient.isPerishable || fechaSegura === '') {
        fechaSegura = null;
    }

    let stockIngresado = Number(this.newQuickIngredient.initialStock) || 0;
    let costoTotalIngresado = Number(this.newQuickIngredient.totalCost) || 0;
    let costoUnitarioCalculado = 0;

    if (stockIngresado > 0) {
      costoUnitarioCalculado = costoTotalIngresado / stockIngresado;
    } else {
      costoUnitarioCalculado = costoTotalIngresado;
    }

    const payloadParaNET = {
      name: this.newQuickIngredient.name,
      category: this.newQuickIngredient.category,
      baseUnit: this.newQuickIngredient.baseUnit, 
      initialStock: stockIngresado, 
      initialCost: costoUnitarioCalculado,
      minimumStock: Number(this.newQuickIngredient.minimumStock) || 0,
      isPerishable: Boolean(this.newQuickIngredient.isPerishable),
      expirationDate: fechaSegura
    };

    // MAGIA: Decide si crea uno nuevo o actualiza el existente
    const request = (this.isEditingQuickIngredient && this.editingIngredientId)
      ? this.adminService.updateIngredient(this.editingIngredientId as number, payloadParaNET)
      : this.adminService.createIngredient(payloadParaNET);

    request.subscribe({
      next: () => this.procesarGuardadoExitoso(),
      error: (err) => {
        if (err.status === 200 || err.status === 201 || err.status === 204) {
          this.procesarGuardadoExitoso();
        } else {
          console.error("Error del backend:", err);
          this.showError('Error al procesar la solicitud.');
          this.isSavingQuickIngredient = false; 
        }
      }
    });
  }

  procesarGuardadoExitoso() {
    this.successMessage = this.isEditingQuickIngredient ? 'Insumo actualizado correctamente.' : 'Insumo creado rápidamente.';
    this.loadRealIngredients();
    this.resetQuickForm(); // Limpia el formulario pero NO cierra el modal para que veas la lista
    this.isSavingQuickIngredient = false;
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    setTimeout(() => { 
      this.errorMessage = ''; 
      this.cdr.detectChanges(); 
    }, 3000);
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  closeDashboard() {
    this.selectedDish = null;
    this.isCreatingDish = false;
    this.clearMessages();
    document.body.classList.remove('modal-open');
  }
} 