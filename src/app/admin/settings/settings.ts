import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  activeTab: string = 'Usuarios';
  isLoading: boolean = false;
  
  // Variables Originales de Usuarios
  users: any[] = [];
  showUserModal: boolean = false;
  isEditingUser: boolean = false;
  currentUser: any = { username: '', password: '', role: '' };

  // NUEVO: Variables para Filtrado de Usuarios
  filteredUsers: any[] = [];
  searchUsername: string = '';
  filterRole: string = 'Todos';

  // Datos del Restaurante
  restaurantData = { name: 'Sonqo Restaurant', ruc: '20123456789', address: 'Av. Principal 123' };

  // Notificaciones
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  isSavingUser: boolean = false;
  isSuperAdmin: boolean = false;
  newRestaurantData = { name: '', ruc: '', address: '' };

  constructor(
    private adminService: AdminService, 
    private cdr: ChangeDetectorRef, 
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsers();
      this.loadSettings();
      this.isSuperAdmin = this.authService.getUserRole() === 'SuperAdmin';
    } else {
      this.isLoading = false;
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMessage = ''; this.cdr.detectChanges(); }, 4000);
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        // SOLUCIÓN AL ORDEN: Siempre ordenamos por el ID del usuario (de más antiguo a más nuevo)
        this.users = (data || []).sort((a: any, b: any) => a.id - b.id);
        
        // Aplicamos el filtro para actualizar la vista
        this.applyFilters();
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar la lista de usuarios.', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSettings() {
    this.adminService.getSettings().subscribe({
      next: (data) => {
        if (data) {
           this.restaurantData = data;
        }
      },
      error: () => console.error("Error al cargar la configuración")
    });
  }

  createNewRestaurant() {
    if (!this.newRestaurantData.name) {
      this.showToast('El nombre de la empresa es obligatorio.', 'error');
      return;
    }

    this.adminService.createNewRestaurant(this.newRestaurantData).subscribe({
      next: (res: any) => {
        this.showToast(res.message, 'success');
        // Limpiamos el formulario
        this.newRestaurantData = { name: '', ruc: '', address: '' };
      },
      error: (err) => this.showToast(err.error || 'Error al crear empresa.', 'error')
    });
  }

  // NUEVO: Método que filtra la lista maestra
  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      // 1. Filtro por Rol
      const matchesRole = this.filterRole === 'Todos' || user.role === this.filterRole;
      
      // 2. Filtro por Nombre
      const matchesName = user.username.toLowerCase().includes(this.searchUsername.toLowerCase());
      
      return matchesRole && matchesName;
    });
  }

  openUserModal(user?: any) {
    if (user) {
      this.isEditingUser = true;
      this.currentUser = { ...user, password: '' };
    } else {
      this.isEditingUser = false;
      this.currentUser = { username: '', password: '', role: '' };
    }
    this.showUserModal = true;
    document.body.classList.add('modal-open');
  }

  closeUserModal() {
    this.showUserModal = false;
    document.body.classList.remove('modal-open');
  }

  saveUser() {
    if (!this.currentUser.username || !this.currentUser.role) {
      this.showToast('Llene los campos obligatorios.', 'error');
      return;
    }
    if (!this.isEditingUser && !this.currentUser.password) {
      this.showToast('La contraseña es obligatoria para usuarios nuevos.', 'error');
      return;
    }

    // Bloqueamos el botón al instante
    this.isSavingUser = true;
    this.cdr.detectChanges(); // Forzamos a Angular a mostrar el cambio visual

    const request = this.isEditingUser 
      ? this.adminService.updateUser(this.currentUser.id, this.currentUser)
      : this.adminService.createUser(this.currentUser);

    request.subscribe({
      next: () => {
        this.showToast(this.isEditingUser ? 'Usuario actualizado' : 'Usuario creado', 'success');
        this.isSavingUser = false;
        this.closeUserModal();
        this.loadUsers();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Error al guardar el usuario', 'error');
        this.isSavingUser = false;
        this.cdr.detectChanges(); // Refrescamos la vista para volver a habilitar el botón
      }
    });
  }

  deleteUser(id: number) {
    if(confirm('¿Seguro que deseas eliminar este usuario?')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.showToast('Usuario eliminado', 'success');
          this.loadUsers();
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Error al eliminar', 'error');
        }
      });
    }
  }

  saveRestaurantData() {
    this.adminService.saveSettings(this.restaurantData).subscribe({
      next: (res: any) => {
        this.showToast(res.message || 'Datos del restaurante actualizados.', 'success');
      },
      error: () => {
        this.showToast('Error al guardar los datos del restaurante.', 'error');
      }
    });
  }
}