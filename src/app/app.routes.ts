import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { MainLayout } from './layout/main-layout/main-layout'; // Importa el layout que acabamos de crear
import { Dashboard } from './admin/dashboard/dashboard';
import { DishesManagementComponent } from './admin/dishes-management/dishes-management';
import { InventoryComponent } from './admin/inventory/inventory';
import { KitchenDisplayComponent } from './admin/kitchen-display/kitchen-display';
import { Orders } from './admin/orders/orders';
import { AuthGuard } from './core/guards/auth-guard';

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
        component: Dashboard,
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
        component: Orders,
        data: { expectedRoles: ['SuperAdmin', 'Admin', 'Waiter'] }
      }
    ]
  },

  // 3. RUTA COMODÍN (Si no existe, va al login)
  { path: '**', redirectTo: 'login' }
];