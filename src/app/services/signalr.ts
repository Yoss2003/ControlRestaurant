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
  private orderUpdateSubject = new Subject<string>();
  public orderUpdates$ = this.orderUpdateSubject.asObservable();

  constructor(private authService: AuthService, @Inject(PLATFORM_ID) private platformId: Object) { }

  public startConnection = () => {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.authService.getToken()?.replace(/['"]+/g, '') || '';    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
          accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('🟢 Conectado al Hub de SignalR (Tiempo Real Activado)'))
      .catch(err => console.error('🔴 Error conectando a SignalR: ', err));

    this.hubConnection.on('ReceiveOrderUpdate', (message: string) => {
      console.log('🔔 Actualización en tiempo real recibida:', message);
      this.orderUpdateSubject.next(message);
    });
  }
}