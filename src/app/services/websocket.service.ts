import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface PoseFrame {
  type: 'frame';
  keypoints: number[][];
}

export interface BufferStatus {
  type: 'buffer_status';
  stats: {
    current_size: number;
    window_size: number;
    is_ready: boolean;
    total_frames_received: number;
    fill_percentage: number;
  };
}

export interface Prediction {
  type: 'prediction';
  classification: 'correcto' | 'incorrecto';
  confidence: number;
  is_confident: boolean;
  probabilities: {
    incorrecto: number;
    correcto: number;
  };
  stats: BufferStatus['stats'];
}

export interface ConnectedMessage {
  type: 'connected';
  message: string;
  connection_id: string;
  config: {
    window_size: number;
    expected_keypoints: number;
  };
}

export type WebSocketMessage = BufferStatus | Prediction | ConnectedMessage;

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly wsUrl = 'ws://localhost:8000/ws/pose-analysis';
  
  // Observables para diferentes tipos de mensajes
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private bufferStatusSubject = new Subject<BufferStatus>();
  private predictionSubject = new Subject<Prediction>();
  private errorSubject = new Subject<string>();
  
  public connected$ = this.connectedSubject.asObservable();
  public bufferStatus$ = this.bufferStatusSubject.asObservable();
  public prediction$ = this.predictionSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor() {}

  /**
   * Conecta al WebSocket del backend
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.connectedSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error al parsear mensaje:', error);
          this.errorSubject.next('Error al procesar mensaje del servidor');
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.errorSubject.next('Error de conexión con el servidor');
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        this.connectedSubject.next(false);
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('Error al crear WebSocket:', error);
      this.errorSubject.next('No se pudo conectar al servidor');
    }
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  /**
   * Envía un frame de keypoints al backend
   */
  sendFrame(keypoints: number[][]): void {
    if (!this.isConnected()) {
      console.warn('WebSocket no conectado. Intentando reconectar...');
      this.connect();
      return;
    }

    const frame: PoseFrame = {
      type: 'frame',
      keypoints: keypoints
    };

    try {
      this.socket!.send(JSON.stringify(frame));
    } catch (error) {
      console.error('Error al enviar frame:', error);
      this.errorSubject.next('Error al enviar datos');
    }
  }

  /**
   * Resetea el buffer del backend
   */
  resetBuffer(): void {
    if (!this.isConnected()) {
      return;
    }

    try {
      this.socket!.send(JSON.stringify({ type: 'reset' }));
    } catch (error) {
      console.error('Error al resetear buffer:', error);
    }
  }

  /**
   * Envía ping para mantener conexión activa
   */
  ping(): void {
    if (!this.isConnected()) {
      return;
    }

    try {
      this.socket!.send(JSON.stringify({ type: 'ping' }));
    } catch (error) {
      console.error('Error al enviar ping:', error);
    }
  }

  /**
   * Verifica si el WebSocket está conectado
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Maneja los diferentes tipos de mensajes del servidor
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('🎉 Conectado al servidor:', message);
        break;

      case 'buffer_status':
        this.bufferStatusSubject.next(message);
        break;

      case 'prediction':
        console.log('🎯 Predicción recibida:', message);
        this.predictionSubject.next(message);
        break;

      default:
        console.log('Mensaje desconocido:', message);
    }
  }

  /**
   * Intenta reconectar al WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.errorSubject.next('No se pudo reconectar al servidor');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    this.disconnect();
  }
}
