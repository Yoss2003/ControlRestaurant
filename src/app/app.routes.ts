import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { MainLayout } from './layout/main-layout/main-layout'; // Importa el layout que acabamos de crear
import { DashboardComponent } from './admin/dashboard/dashboard';
import { DishesManagementComponent } from './admin/dishes-management/dishes-management';
import { InventoryComponent } from './admin/inventory/inventory';
import { KitchenDisplayComponent } from './admin/kitchen-display/kitchen-display';
import { OrdersComponent } from './admin/orders/orders';
import { AuthGuard } from './core/guards/auth-guard';
import { CashRegisterComponent } from './admin/cash-register/cash-register';
import { SettingsComponent } from './admin/settings/settings';

export const routes: Routes = [
  // 1. RUTA PÚBLICA (Sin Sidebar)
  { path: 'login', component: LoginComponent },

  // 2. RUTAS PRIVADAS (Adentro del Layout con Sidebar)
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        data: { expectedRoles: ['SuperAdmin', 'Admin'] } 
      },
      { 
        path: 'platos', 
        component: DishesManagementComponent,
        data: { expectedRoles: ['SuperAdmin', 'Admin'] }
      },
      { 
        path: 'inventario', 
        component: InventoryComponent,
        data: { expectedRoles: ['SuperAdmin', 'Admin'] }
      },
      { 
        path: 'cocina', 
        component: KitchenDisplayComponent,
        data: { expectedRoles: ['SuperAdmin', 'Admin', 'Kitchen'] }
      },
      { 
        path: 'pedidos', 
        component: OrdersComponent,
        data: { expectedRoles: ['SuperAdmin', 'Admin', 'Waiter'] }
      },
      { 
        path: 'caja', 
        component: CashRegisterComponent, 
        data: { expectedRoles: ['SuperAdmin', 'Admin'] } 
      },
      { 
        path: 'ajustes', 
        component: SettingsComponent, 
        data: { expectedRoles: ['SuperAdmin', 'Admin'] } 
      }
    ]
  },

  // 3. RUTA COMODÍN (Si no existe, va al login)
  { path: '**', redirectTo: 'login' }
];