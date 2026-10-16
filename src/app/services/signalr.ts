import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class Signalr {
  private hubConnection: signalR.HubConnection | undefined;
  // RC09: Cambiamos string a 'any' para aceptar los objetos que envía la API
  private orderUpdateSubject = new Subject<any>(); 
  public orderUpdates$ = this.orderUpdateSubject.asObservable();

  constructor(private authService: AuthService, @Inject(PLATFORM_ID) private platformId: Object) { }

  public startConnection = () => {
    if (!isPlatformBrowser(this.platformId)) return;

    // RC06: Si ya está conectado o conectándose, cortamos para no duplicar conexiones
    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
          // RC07: El token se lee dinámicamente en cada reconexión
          accessTokenFactory: () => this.authService.getToken()?.replace(/['"]+/g, '') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('🟢 Conectado al Hub de SignalR'))
      .catch(err => console.error('🔴 Error conectando a SignalR: ', err));

    this.hubConnection.on('ReceiveOrderUpdate', (message: any) => {
      console.log('🔄 Actualización en tiempo real recibida:', message);
      this.orderUpdateSubject.next(message);
    });
  }

  // RC06: Método de limpieza esencial
  public stopConnection = () => {
    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      this.hubConnection.stop().then(() => console.log('🔴 Desconectado del Hub de SignalR'));
      this.hubConnection = undefined;
    }
  }
}