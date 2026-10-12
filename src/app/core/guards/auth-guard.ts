import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  if (typeof window === 'undefined') {
    return true; 
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  const expectedRoles = route.data['expectedRoles'] as Array<string>;
  
  if (expectedRoles) {
    const userRole = authService.getUserRole();
    
    if (!expectedRoles.includes(userRole)) {
      console.warn(`Acceso denegado: Rol insuficiente (${userRole})`);
      
      if (userRole === 'Kitchen') {
        return router.parseUrl('/cocina');
      } else if (userRole === 'Waiter') {
        return router.parseUrl('/pedidos');
      } else {
        return router.parseUrl('/dashboard');
      }
    }
  }

  return true; 
};