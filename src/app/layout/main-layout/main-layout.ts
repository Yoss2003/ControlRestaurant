import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Signalr } from '../../services/signalr';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayout implements OnInit {
  isSidebarExpanded = true;
  isMobile = false;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private signalr: Signalr
  ) {}

  ngOnInit() {
    this.checkScreenSize();
  }

  // Escucha si el usuario cambia el tamaño de la ventana
  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth <= 768;
      // En PC siempre abierto por defecto, en móvil cerrado por defecto
      if (this.isMobile) {
        this.isSidebarExpanded = false;
      }
    }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
    this.signalr.stopConnection();
    this.router.navigate(['/login']);
  }
}