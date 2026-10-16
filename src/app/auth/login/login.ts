import { Component, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef // <-- INYECTAMOS EL DETECTOR DE CAMBIOS
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // Forzamos a la pantalla a mostrar "Verificando..."

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
        
        const role = this.authService.getUserRole();
        
        if (role === 'Admin' || role === 'SuperAdmin') {
          this.router.navigate(['/dashboard']);
        } else if (role === 'Kitchen') {
          this.router.navigate(['/cocina']);
        } else if (role === 'Waiter') {
          this.router.navigate(['/pedidos']);
        } else {
          this.router.navigate(['/pedidos']);
        }
      },
      error: (err) => {
        console.error("Error capturado en el Login:", err); // Para que lo veas en F12
        
        // RE-HABILITAMOS EL BOTÓN
        this.isLoading = false;

        // EVALUAMOS TODOS LOS POSIBLES ERRORES (401, 404, 400 y 0)
        if (err.status === 0) {
          this.errorMessage = 'No hay conexión. Verifica que la API (C#) esté encendida.';
        } else if (err.status === 401 || err.status === 404 || err.status === 400) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        } else {
          this.errorMessage = 'Error del servidor. Inténtalo de nuevo más tarde.';
        }

        // ¡EL TOQUE MÁGICO! 
        // Obligamos a Angular a repintar la pantalla AHORA MISMO
        this.cdr.detectChanges(); 
      }
    });
  }
}