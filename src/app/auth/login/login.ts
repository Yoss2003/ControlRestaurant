import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service'; // Importamos tu nuevo servicio

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

  // Inyectamos el AuthService en lugar de HttpClient
  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    // Delegamos la llamada al servicio que creamos
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
        
        // Obtenemos el rol del usuario que acaba de ingresar
        const role = this.authService.getUserRole();
        
        // Lógica inteligente de redirección según el rol
        if (role === 'Admin' || role === 'SuperAdmin') {
          this.router.navigate(['/dashboard']);
        } else if (role === 'Kitchen') {
          this.router.navigate(['/cocina']);
        } else if (role === 'Waiter') {
          this.router.navigate(['/pedidos']);
        } else {
          // Fallback por defecto si no reconocemos el rol
          this.router.navigate(['/pedidos']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 404) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        } else {
          this.errorMessage = 'Error al conectar con el servidor. Verifica que la API esté corriendo.';
        }
      }
    });
  }
}