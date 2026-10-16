import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') {
    return next(req);
  }
  
  if (req.url.includes('manifest.json') || req.url.includes('assets/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken();
  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401 && !req.url.includes('/login')) {
        console.warn('Sesión expirada. Redirigiendo al login...');
        authService.logout();
      }
      
      return throwError(() => error);
    })
  );
};