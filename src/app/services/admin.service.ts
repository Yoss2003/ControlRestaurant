import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // Ajusta tu IP local de pruebas
  private ordersUrl = `${environment.apiUrl}/Orders`;
  private dishesUrl = `${environment.apiUrl}/Dishes`;
  private inventoryUrl = `${environment.apiUrl}/Inventory`;
  private tablesUrl = `${environment.apiUrl}/Tables`;
  private cashUrl = `${environment.apiUrl}/CashRegister`;
  private usersUrl = `${environment.apiUrl}/Users`;
  private configUrl = `${environment.apiUrl}/Settings`;

  constructor(private http: HttpClient) { }

  // ---- GESTIÓN DE PLATOS Y RECETAS ----
  getShoppingList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.dishesUrl}/shopping-list`);
  }

  getDishes(): Observable<any> {
    return this.http.get(`${this.dishesUrl}`);
  }

  getRecipe(dishId: number): Observable<any> {
    return this.http.get<any>(`${this.dishesUrl}/${dishId}/recipe`);
  }

  createDish(dishData: any): Observable<any> {  
    return this.http.post(`${this.dishesUrl}`, dishData);
  }

  updateDish(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.dishesUrl}/${id}`, payload);
  }

  assignRecipe(recipeData: any): Observable<any> {
    return this.http.post(`${this.dishesUrl}/assign-recipe`, recipeData);
  }

  // ---- GESTIÓN DE INVENTARIO ----
  getIngredients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.inventoryUrl}/ingredients`);
  }

  createIngredient(payload: any): Observable<any> {
    return this.http.post(`${this.inventoryUrl}/ingredients`, payload);
  }

  updateIngredient(id: number, ingredientData: any): Observable<any> {
    return this.http.put(`${this.inventoryUrl}/ingredients/${id}`, ingredientData);
  }

  deleteIngredient(id: number): Observable<any> {
    return this.http.delete(`${this.inventoryUrl}/ingredients/${id}`);
  }

  restockIngredient(restockData: any): Observable<any> {
    return this.http.post(`${this.inventoryUrl}/ingredients/restock`, restockData);
  }

  // ---- GESTIÓN DE MESAS ----
  getTables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.tablesUrl}`);
  }

  createTable(tableData: any): Observable<any> {
    return this.http.post(`${this.tablesUrl}`, tableData);
  }

  updateTable(id: number, tableData: any): Observable<any> {
    return this.http.put(`${this.tablesUrl}/${id}`, tableData);
  }

  deleteTable(id: number): Observable<any> {
    return this.http.delete(`${this.tablesUrl}/${id}`);
  }

  // ---- GESTIÓN DE PEDIDOS ----
  createOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.ordersUrl}`, orderData);
  }

  // ---- GESTIÓN DE COCINA (KDS) ----
  getKitchenOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.ordersUrl}/kitchen`);
  }

  updateDetailStatus(detailId: number, status: string): Observable<any> {
    return this.http.patch(`${this.ordersUrl}/details/${detailId}/status`, { status });
  }

  getActiveOrder(tableId: number): Observable<any> {
    return this.http.get(`${this.ordersUrl}/table/${tableId}/active`);
  }

  payOrder(tableId: number, paymentData: any): Observable<any> {
    return this.http.post(`${this.ordersUrl}/table/${tableId}/pay`, paymentData);
  }

  getDashboardMetrics(): Observable<any> {
    return this.http.get(`${this.ordersUrl}/dashboard`);
  }

  // ---- GESTIÓN DE CAJA CHICA ----
  getCurrentCashRegister(): Observable<any> {
    return this.http.get(`${this.cashUrl}/current`);
  }

  openCashRegister(payload: any): Observable<any> {
    return this.http.post(`${this.cashUrl}/open`, payload);
  }

  closeCashRegister(payload: any): Observable<any> {
    return this.http.post(`${this.cashUrl}/close`, payload);
  }

  // ---- GESTIÓN DE USUARIOS Y CONFIGURACIÓN ----
  createNewRestaurant(data: any): Observable<any> {
    return this.http.post(`${this.configUrl}/new-restaurant`, data);
  }
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.usersUrl);
  }
  createUser(userData: any): Observable<any> {
    return this.http.post(this.usersUrl, userData);
  }
  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put(`${this.usersUrl}/${id}`, userData);
  }
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.usersUrl}/${id}`);
  }

  //---- GESTIÓN DE CONFIGURACIÓN DEL RESTAURANTE ----
  getSettings(): Observable<any> {
    return this.http.get(this.configUrl);
  }
  saveSettings(data: any): Observable<any> {
    return this.http.post(this.configUrl, data);
  }
}