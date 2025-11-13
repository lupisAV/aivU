import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../services/websocket.service';
import { MediaPipeService } from '../../services/mediapipe.service';
import { ExerciseOverlayComponent } from '../exercise-overlay/exercise-overlay.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-exercise-camera',
  standalone: true,
  imports: [CommonModule, ExerciseOverlayComponent],
  templateUrl: './exercise-camera.component.html',
  styleUrls: ['./exercise-camera.component.css']
})
export class ExerciseCameraComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild(ExerciseOverlayComponent) overlayComponent!: ExerciseOverlayComponent;

  isLoading = true;
  isActive = false;
  errorMessage = '';
  showError = false;
  
  // Buffer temporal para acumular frames
  private frameBuffer: number[][] = [];
  
  private subscriptions: Subscription[] = [];
  private frameInterval: any;

  constructor(
    private wsService: WebSocketService,
    private mediaPipeService: MediaPipeService
  ) {}

  ngOnInit(): void {
    // Suscribirse a errores del WebSocket
    this.subscriptions.push(
      this.wsService.error$.subscribe(error => {
        this.showErrorMessage(error);
      })
    );
  }

  ngAfterViewInit(): void {
    // Inicializar después de que la vista esté lista
    setTimeout(() => {
      this.initializeServices();
    }, 100);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Inicializa los servicios de MediaPipe y WebSocket
   */
  private async initializeServices(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Inicializar MediaPipe
      await this.mediaPipeService.initialize(
        this.videoElement.nativeElement,
        this.canvasElement.nativeElement
      );
      
      // Conectar WebSocket
      this.wsService.connect();
      
      // Esperar a que se conecte
      await this.waitForConnection();
      
      this.isLoading = false;
      console.log('✅ Servicios inicializados');
      
    } catch (error) {
      console.error('Error al inicializar servicios:', error);
      this.showErrorMessage('Error al inicializar los servicios');
      this.isLoading = false;
    }
  }

  /**
   * Espera a que el WebSocket se conecte
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout al conectar'));
      }, 10000);

      const sub = this.wsService.connected$.subscribe(connected => {
        if (connected) {
          clearTimeout(timeout);
          sub.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Inicia la captura de ejercicio
   */
  async startExercise(): Promise<void> {
    if (this.isActive) {
      return;
    }

    try {
      // Iniciar cámara
      await this.mediaPipeService.startCamera();
      
      // Suscribirse a keypoints de brazos
      this.subscriptions.push(
        this.mediaPipeService.armKeypoints$.subscribe(keypoints => {
          this.sendKeypointsToBackend(keypoints);
        })
      );
      
      this.isActive = true;
      console.log('✅ Ejercicio iniciado');
      
    } catch (error) {
      console.error('Error al iniciar ejercicio:', error);
      this.showErrorMessage('No se pudo acceder a la cámara');
    }
  }

  /**
   * Detiene la captura de ejercicio
   */
  stopExercise(): void {
    if (!this.isActive) {
      return;
    }

    this.mediaPipeService.stopCamera();
    this.isActive = false;
    console.log('🛑 Ejercicio detenido');
  }

  /**
   * Envía keypoints al backend vía WebSocket
   */
  private sendKeypointsToBackend(keypoints: number[][]): void {
    if (!this.wsService.isConnected()) {
      return;
    }

    // Aplanar keypoints de (6, 3) a (18,)
    const flatKeypoints = keypoints.flat();
    
    // Agregar al buffer
    this.frameBuffer.push(flatKeypoints);
    
    // Mantener solo los últimos 30 frames
    if (this.frameBuffer.length > 30) {
      this.frameBuffer.shift();
    }
    
    // Si tenemos 30 frames, actualizar el overlay
    if (this.frameBuffer.length === 30 && this.overlayComponent) {
      this.overlayComponent.currentSequence = [...this.frameBuffer];
    }

    this.wsService.sendFrame(keypoints);
  }

  /**
   * Muestra un mensaje de error
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    
    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  /**
   * Limpia recursos
   */
  private cleanup(): void {
    this.stopExercise();
    this.mediaPipeService.cleanup();
    this.wsService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }
  }

  /**
   * Alterna entre iniciar y detener
   */
  toggleExercise(): void {
    if (this.isActive) {
      this.stopExercise();
    } else {
      this.startExercise();
    }
  }
}
