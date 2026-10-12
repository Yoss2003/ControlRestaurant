import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Signalr {
  private hubConnection: signalR.HubConnection | undefined;
  
  // Este "Subject" es como un megáfono. Cuando C# envíe un mensaje, 
  // este megáfono lo gritará a cualquier componente que esté escuchando.
  private orderUpdateSubject = new Subject<string>();
  public orderUpdates$ = this.orderUpdateSubject.asObservable();

  constructor() { }

  public startConnection = () => {
    // IMPORTANTE: Cambia esta URL si tu backend corre en otro puerto
    this.hubConnection = new signalR.HubConnectionBuilder()
                            .withUrl(environment.hubUrl)
                            .withAutomaticReconnect()
                            .build();

    this.hubConnection
      .start()
      .then(() => console.log('🟢 Conectado al Hub de SignalR (Tiempo Real Activado)'))
      .catch(err => console.error('🔴 Error conectando a SignalR: ', err));

    // Aquí le decimos qué hacer cuando escuche el grito "ReceiveOrderUpdate" desde C#
    this.hubConnection.on('ReceiveOrderUpdate', (message: string) => {
      console.log('⚡ Actualización en tiempo real recibida:', message);
      this.orderUpdateSubject.next(message); // Pasa el mensaje por el megáfono
    });
  }
}