import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') {
    return next(req);
  }

  // NUEVO: Ignorar el manifest y archivos estáticos para que no bloquee el inicio
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
      if (error.status === 401) {
        console.warn('Sesión expirada. Redirigiendo al login...');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};