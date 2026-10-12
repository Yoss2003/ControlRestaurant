import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // 1. Intentamos obtener el token del localStorage
    let token = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
    }

    // 2. Si el token existe, clonamos la petición y le pegamos la cabecera de autorización
    if (token) {
      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      // Dejamos que la petición continúe su viaje con el token puesto
      return next.handle(clonedRequest);
    }

    // Si no hay token (ej. está en la pantalla de login), la mandamos normal
    return next.handle(request);
  }
}