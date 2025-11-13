import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService, Prediction, BufferStatus } from '../../services/websocket.service';
import { DataService } from '../../services/data.service';
import { SaveExerciseModalComponent, SaveExerciseData } from '../save-exercise-modal/save-exercise-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-exercise-overlay',
  standalone: true,
  imports: [CommonModule, SaveExerciseModalComponent],
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
  
  private subscriptions: Subscription[] = [];
  private sessionTimer: any;

  constructor(
    private wsService: WebSocketService,
    private dataService: DataService
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
   */
  private handlePrediction(prediction: Prediction): void {
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
    }, 3000);
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
   */
  saveSession(): void {
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

    this.dataService.saveSession(sessionData).subscribe({
      next: (response) => {
        console.log('✅ Sesión guardada:', response);
        alert('Sesión guardada exitosamente!');
      },
      error: (error) => {
        console.error('❌ Error al guardar sesión:', error);
        alert('Error al guardar la sesión.');
      }
    });
  }
}
