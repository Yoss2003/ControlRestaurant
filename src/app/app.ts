import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  isSidebarExpanded: boolean = true; 
  isMobile: boolean = false;
  
  // Temporizador de inactividad
  inactivityTimer: any;
  readonly TIMEOUT_MINUTES = 15;

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.checkScreenSize();
    this.resetInactivityTimer(); // Iniciamos el reloj
  }

  // Escuchamos si el usuario mueve el mouse o presiona teclas en CUALQUIER parte del sistema
  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  @HostListener('window:click')
  @HostListener('window:touchstart') // Para móviles
  resetInactivityTimer() {
    clearTimeout(this.inactivityTimer);
    
    // Si el usuario está logueado, reiniciamos el reloj
    if (this.authService.isLoggedIn()) {
      this.inactivityTimer = setTimeout(() => {
        console.warn('Sesión cerrada por inactividad.');
        this.logout();
      }, this.TIMEOUT_MINUTES * 60 * 1000);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 1024; 
    this.isSidebarExpanded = !this.isMobile;
  }

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  closeSidebarOnMobile() {
    if (this.isMobile) {
      this.isSidebarExpanded = false;
    }
  }

  logout() {
    clearTimeout(this.inactivityTimer); // Apagamos el reloj
    this.authService.logout();
    this.closeSidebarOnMobile();
  }
}