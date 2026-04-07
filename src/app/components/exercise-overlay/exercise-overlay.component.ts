import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebSocketService, Prediction, BufferStatus } from '../../services/websocket.service';
import { DataService } from '../../services/data.service';
import { FeedbackService } from '../../services/feedback.service';
import { SaveExerciseModalComponent, SaveExerciseData } from '../save-exercise-modal/save-exercise-modal.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-exercise-overlay',
  standalone: true,
  imports: [CommonModule, SaveExerciseModalComponent, ConfirmationDialogComponent],
  templateUrl: './exercise-overlay.component.html',
  styleUrls: ['./exercise-overlay.component.css']
})
export class ExerciseOverlayComponent implements OnInit, OnDestroy {
  @Input() currentSequence: number[][] | null = null;
  
  // Estado de conexión
  isConnected = false;
  
  // Estado del buffer
  bufferProgress = 0;
  bufferSize = 0;
  bufferMax = 30;
  isBufferReady = false;
  
  // Última predicción
  lastPrediction: Prediction | null = null;
  showPrediction = false;
  
  // Contador de repeticiones
  correctReps = 0;
  incorrectReps = 0;
  totalReps = 0;
  
  // Estadísticas de sesión
  sessionStartTime: Date | null = null;
  sessionDuration = 0;
  averageConfidence = 0;
  sessionId = '';
  
  // Historial de predicciones
  predictionHistory: Prediction[] = [];
  
  // Modal de guardar ejercicio
  showSaveModal = false;
  
  // Delay entre correcciones (5 segundos)
  canAcceptPrediction = true;
  private readonly PREDICTION_DELAY = 5000; // 5 segundos entre correcciones
  private readonly DISPLAY_TIME = 3000; // 3 segundos para mostrar la corrección
  
  // Modal de confirmación para finalizar
  showFinishConfirm = false;
  
  private subscriptions: Subscription[] = [];
  private sessionTimer: any;

  constructor(
    private wsService: WebSocketService,
    private dataService: DataService,
    private feedbackService: FeedbackService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de conexión
    this.subscriptions.push(
      this.wsService.connected$.subscribe(connected => {
        this.isConnected = connected;
        if (connected && !this.sessionStartTime) {
          this.startSession();
        }
      })
    );

    // Suscribirse al estado del buffer
    this.subscriptions.push(
      this.wsService.bufferStatus$.subscribe(status => {
        this.updateBufferStatus(status);
      })
    );

    // Suscribirse a predicciones
    this.subscriptions.push(
      this.wsService.prediction$.subscribe(prediction => {
        this.handlePrediction(prediction);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }
  }

  /**
   * Actualiza el estado del buffer
   */
  private updateBufferStatus(status: BufferStatus): void {
    this.bufferSize = status.stats.current_size;
    this.bufferMax = status.stats.window_size;
    this.bufferProgress = status.stats.fill_percentage;
    this.isBufferReady = status.stats.is_ready;
  }

  /**
   * Maneja una nueva predicción
   * Implementa un delay de 5 segundos entre correcciones para evitar que lleguen muy rápido
   */
  private handlePrediction(prediction: Prediction): void {
    // Solo procesar si ha pasado el tiempo mínimo de 5 segundos desde la última corrección
    if (!this.canAcceptPrediction) {
      return; // Ignorar predicciones durante el delay
    }

    // Aceptar la predicción
    this.lastPrediction = prediction;
    this.showPrediction = true;
    
    // Agregar al historial
    this.predictionHistory.push(prediction);
    if (this.predictionHistory.length > 10) {
      this.predictionHistory.shift();
    }
    
    // Actualizar contador de repeticiones
    this.totalReps++;
    if (prediction.classification === 'correcto') {
      this.correctReps++;
    } else {
      this.incorrectReps++;
    }
    
    // Calcular confianza promedio
    this.calculateAverageConfidence();
    
    // Ocultar predicción después de 3 segundos
    setTimeout(() => {
      this.showPrediction = false;
    }, this.DISPLAY_TIME);

    // Bloquear nuevas predicciones por 5 segundos
    this.canAcceptPrediction = false;
    setTimeout(() => {
      this.canAcceptPrediction = true;
    }, this.PREDICTION_DELAY);
  }

  /**
   * Calcula la confianza promedio de la sesión
   */
  private calculateAverageConfidence(): void {
    if (this.predictionHistory.length === 0) {
      this.averageConfidence = 0;
      return;
    }
    
    const sum = this.predictionHistory.reduce(
      (acc, pred) => acc + pred.confidence,
      0
    );
    this.averageConfidence = sum / this.predictionHistory.length;
  }

  /**
   * Inicia una nueva sesión
   */
  private startSession(): void {
    this.sessionStartTime = new Date();
    this.sessionId = `session_${Date.now()}`;
    this.sessionTimer = setInterval(() => {
      if (this.sessionStartTime) {
        const now = new Date();
        this.sessionDuration = Math.floor(
          (now.getTime() - this.sessionStartTime.getTime()) / 1000
        );
      }
    }, 1000);
  }

  /**
   * Resetea el contador de repeticiones
   */
  resetCounter(): void {
    this.correctReps = 0;
    this.incorrectReps = 0;
    this.totalReps = 0;
    this.predictionHistory = [];
    this.averageConfidence = 0;
    this.wsService.resetBuffer();
  }

  /**
   * Obtiene el color según la clasificación
   */
  getClassificationColor(): string {
    if (!this.lastPrediction) return '#6B7280';
    return this.lastPrediction.classification === 'correcto' ? '#10B981' : '#EF4444';
  }

  /**
   * Obtiene el icono según la clasificación
   */
  getClassificationIcon(): string {
    if (!this.lastPrediction) return '❓';
    return this.lastPrediction.classification === 'correcto' ? '✓' : '✗';
  }

  /**
   * Obtiene el porcentaje de aciertos
   */
  getSuccessRate(): number {
    if (this.totalReps === 0) return 0;
    return Math.round((this.correctReps / this.totalReps) * 100);
  }

  /**
   * Formatea la duración de la sesión
   */
  formatDuration(): string {
    const minutes = Math.floor(this.sessionDuration / 60);
    const seconds = this.sessionDuration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene el mensaje de feedback según la predicción
   */
  getFeedbackMessage(): string {
    if (!this.lastPrediction) return '';
    
    if (this.lastPrediction.classification === 'correcto') {
      if (this.lastPrediction.confidence > 0.95) {
        return '¡Excelente técnica!';
      } else if (this.lastPrediction.confidence > 0.85) {
        return '¡Muy bien!';
      } else {
        return '¡Buen trabajo!';
      }
    } else {
      if (this.lastPrediction.confidence > 0.95) {
        return 'Revisa tu técnica';
      } else if (this.lastPrediction.confidence > 0.85) {
        return 'Puedes mejorar';
      } else {
        return 'Intenta de nuevo';
      }
    }
  }

  /**
   * Abre el modal para guardar ejercicio
   */
  openSaveModal(): void {
    if (!this.currentSequence || this.currentSequence.length === 0) {
      console.warn('No hay secuencia para guardar');
      return;
    }
    this.showSaveModal = true;
  }

  /**
   * Cierra el modal de guardar ejercicio
   */
  closeSaveModal(): void {
    this.showSaveModal = false;
  }

  /**
   * Guarda el ejercicio con la etiqueta seleccionada
   */
  saveExercise(data: SaveExerciseData): void {
    if (!this.currentSequence) {
      console.error('No hay secuencia para guardar');
      return;
    }

    const exerciseData = {
      sequence: this.currentSequence,
      label: data.label,
      user_id: 'user_' + Date.now(), // TODO: Usar ID de usuario real
      exercise_type: data.exerciseType,
      metadata: {
        notes: data.notes,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        confidence: this.lastPrediction?.confidence || 0
      }
    };

    this.dataService.saveExercise(exerciseData).subscribe({
      next: (response) => {
        console.log('✅ Ejercicio guardado:', response);
        alert(`Ejercicio guardado exitosamente!\nID: ${response.exercise_id}`);
        this.closeSaveModal();
      },
      error: (error) => {
        console.error('❌ Error al guardar ejercicio:', error);
        alert('Error al guardar el ejercicio. Verifica que el backend esté corriendo.');
      }
    });
  }

  /**
   * Guarda la sesión completa
   * Retorna un Observable para permitir suscripción y espera de finalización
   */
  saveSession() {
    if (!this.sessionStartTime) {
      console.warn('No hay sesión activa');
      return;
    }

    const sessionData = {
      session_id: this.sessionId,
      user_id: 'user_' + Date.now(), // TODO: Usar ID de usuario real
      start_time: this.sessionStartTime.toISOString(),
      end_time: new Date().toISOString(),
      total_reps: this.totalReps,
      correct_reps: this.correctReps,
      incorrect_reps: this.incorrectReps,
      average_confidence: this.averageConfidence,
      exercises: this.predictionHistory.map(pred => ({
        classification: pred.classification,
        confidence: pred.confidence,
        probabilities: pred.probabilities
      }))
    };

    return this.dataService.saveSession(sessionData);
  }

  /**
   * Abre el diálogo de confirmación para finalizar la sesión
   */
  openFinishDialog(): void {
    this.showFinishConfirm = true;
  }

  /**
   * Cierra el diálogo de confirmación
   */
  closeFinishDialog(): void {
    this.showFinishConfirm = false;
  }

  /**
   * Handler para el botón de guardar sesión
   * Se llama desde el template cuando el usuario hace click
   */
  onSaveSessionClick(): void {
    const saveObservable = this.saveSession();
    
    if (saveObservable) {
      saveObservable.subscribe({
        next: (response) => {
          console.log('✅ Sesión guardada:', response);
          this.feedbackService.success('Sesión guardada exitosamente!');
        },
        error: (error) => {
          console.error('❌ Error al guardar sesión:', error);
          this.feedbackService.error('Error al guardar la sesión.');
        }
      });
    }
  }

  /**
   * Finaliza la sesión y redirige al home
   * Se ejecuta cuando el usuario confirma en el diálogo
   */
  confirmFinishSession(): void {
    this.showFinishConfirm = false;
    
    // Guardar sesión y esperar a que complete
    const saveObservable = this.saveSession();
    
    if (saveObservable) {
      saveObservable.subscribe({
        next: (response) => {
          console.log('✅ Sesión guardada:', response);
          this.feedbackService.success('¡Sesión finalizada! Regresando al inicio...');
          
          // Limpiar recursos
          if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
          }
          
          // Redirigir al home después de 1.5 segundos
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        },
        error: (error) => {
          console.error('❌ Error al guardar sesión:', error);
          this.feedbackService.error('Error al finalizar la sesión.');
          
          // Aún así redirigir al home después del error
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        }
      });
    } else {
      // Si no hay sesión, redirigir directamente
      this.router.navigate(['/home']);
    }
  }
}
