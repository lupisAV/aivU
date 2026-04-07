import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { WebSocketService } from '../../services/websocket.service';
import { MediaPipeService } from '../../services/mediapipe.service';
import { DataService } from '../../services/data.service';
import { ExerciseOverlayComponent } from '../exercise-overlay/exercise-overlay.component';
import { Subscription } from 'rxjs';

interface Exercise {
  name: string;
  reps: number;
  duration: number;
}

interface CorrectionItem {
  icon: string;
  label: string;
  message: string;
  severity: 'ok' | 'warn' | 'error';
}

// Angle zone thresholds
const ANGLE_FULL_EXTENSION = 160;
const ANGLE_DEEP_FLEX = 40;
const ANGLE_GOOD_MIN = 70;
const ANGLE_GOOD_MAX = 160;

@Component({
  selector: 'app-exercise-camera',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ExerciseOverlayComponent],
  templateUrl: './exercise-camera.component.html',
  styleUrls: ['./exercise-camera.component.css']
})
export class ExerciseCameraComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  // Estados
  isLoading = true;
  isActive = false;
  errorMessage = '';
  showError = false;

  // Real-time Feedback State
  currentStatus: 'correct' | 'warning' | 'error' | 'idle' = 'idle';
  currentFeedback: string = 'Inicia el ejercicio para recibir métricas.';
  precisionValue: string = '0%';
  repsCount = 0;

  // Corrections panel state
  correctionItems: CorrectionItem[] = [];
  correctionTitle: string = 'En espera...';
  correctionIcon: string = '⏳';
  bufferFillPct: number = 0;
  confidenceValue: number = 0;

  // Session metrics (dynamic)
  sessionTimeDisplay: string = '00:00';
  cadenceDisplay: string = '0.0/min';
  private sessionSeconds: number = 0;
  private sessionTimerRef: any = null;

  private lastClassification = '';
  private lastLeftAngle = 0;
  private lastRightAngle = 0;

  // Ejercicios
  exercises: Exercise[] = [
    { name: 'Flexión de Bíceps', reps: 10, duration: 30 },
    { name: 'Press de Hombros', reps: 8, duration: 30 },
    { name: 'Extensión de Tríceps', reps: 12, duration: 30 }
  ];

  // Ejercicio seleccionado y editable
  selectedIndex: number = 0;
  get selectedExercise(): Exercise { return this.exercises[this.selectedIndex]; }

  // Buffer para frames
  frameBuffer: number[][] = [];

  // Save to dataset state
  isSaving = false;
  saveMessage = '';
  saveSuccess = false;

  private subscriptions: Subscription[] = [];
  private frameInterval: any;

  constructor(
    private wsService: WebSocketService,
    private mediaPipeService: MediaPipeService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    // Suscribirse a errores del WebSocket
    this.subscriptions.push(
      this.wsService.error$.subscribe(error => {
        this.showErrorMessage(error);
      })
    );

    // Suscribirse a predicciones en tiempo real para correcciones
    this.subscriptions.push(
      this.wsService.prediction$.subscribe(pred => {
        this.handlePrediction(pred);
      })
    );

    // Suscribirse al estado del buffer para mostrar progreso de carga
    this.subscriptions.push(
      this.wsService.bufferStatus$.subscribe(status => {
        this.bufferFillPct = Math.round(status.stats.fill_percentage);
      })
    );
  }

  ngAfterViewInit(): void {
    // Inicializar después de que la vista esté lista
    setTimeout(() => {
      this.initializeServices();
      this.setupAnimations();
    }, 100);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Configura las animaciones GSAP
   */
  private setupAnimations(): void {
    // Animar entrada de cards (stagger)
    const cards = document.querySelectorAll('.exercise-card');
    if (cards.length > 0) {
      gsap.from(cards, {
        duration: 0.4,
        opacity: 0,
        x: -16,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }

    // Animar progress bar
    const progressFill = document.querySelector('.progress-fill') as HTMLElement;
    if (progressFill) {
      gsap.from(progressFill, {
        duration: 0.8,
        width: '0%',
        ease: 'power2.inOut'
      });
    }

    // Animar recommendation card
    const recCard = document.querySelector('.recommendation-card') as HTMLElement;
    if (recCard) {
      gsap.from(recCard, {
        duration: 0.35,
        opacity: 0,
        y: 12,
        delay: 0.2,
        ease: 'power2.out'
      });
    }

    // Setup hover animations en cards
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          duration: 0.2,
          scale: 1.02,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          duration: 0.2,
          scale: 1,
          ease: 'power2.out'
        });
      });
    });

    // Animar donut progress circle
    const donutCircle = document.querySelector('.progress-circle') as SVGCircleElement;
    if (donutCircle) {
      gsap.to(donutCircle, {
        duration: 1.2,
        strokeDashoffset: 43,
        ease: 'power2.inOut'
      });
    }
  }

  /**
   * Inicializa los servicios de MediaPipe y WebSocket
   */
  private async initializeServices(): Promise<void> {
    try {
      this.isLoading = true;
      
      if (!this.videoElement || !this.canvasElement) {
        throw new Error('Elementos de video o canvas no encontrados');
      }
      
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
    if (this.isActive) return;

    try {
      await this.mediaPipeService.startCamera();

      this.subscriptions.push(
        this.mediaPipeService.armKeypoints$.subscribe(keypoints => {
          this.sendKeypointsToBackend(keypoints);
        })
      );

      this.isActive = true;
      this.startSessionTimer();
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
    if (!this.isActive) return;

    this.mediaPipeService.stopCamera();
    this.isActive = false;
    this.stopSessionTimer();
    console.log('🛑 Ejercicio detenido');
  }

  /**
   * Inicia el temporizador de sesión y calcula la cadencia
   */
  private startSessionTimer(): void {
    this.sessionSeconds = 0;
    this.sessionTimeDisplay = '00:00';
    this.cadenceDisplay = '0.0/min';

    this.sessionTimerRef = setInterval(() => {
      this.sessionSeconds++;
      this.sessionTimeDisplay = this.formatTime(this.sessionSeconds);

      // Cadencia: reps por minuto (evitar división temprana)
      const elapsedMin = this.sessionSeconds / 60;
      const cadence = elapsedMin > 0 ? (this.repsCount / elapsedMin) : 0;
      this.cadenceDisplay = `${cadence.toFixed(1)}/min`;
    }, 1000);
  }

  /**
   * Detiene el temporizador de sesión
   */
  private stopSessionTimer(): void {
    if (this.sessionTimerRef) {
      clearInterval(this.sessionTimerRef);
      this.sessionTimerRef = null;
    }
  }

  /**
   * Formatea segundos como MM:SS
   */
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * Cambia el ejercicio seleccionado y reinicia las métricas
   */
  selectExercise(index: number): void {
    this.selectedIndex = index;
    this.repsCount = 0;
    if (this.isActive) {
      this.stopSessionTimer();
      this.startSessionTimer();
    }
  }

  /**
   * Guarda los últimos 30 frames como muestra en el dataset
   */
  saveExerciseToDataset(type: string): void {
    if (this.frameBuffer.length < 30) {
      this.showErrorMessage("Se necesitan al menos 30 frames para guardar.");
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';

    const label = this.lastClassification === 'correcto' ? 1 : 0;
    
    const exerciseData = {
      sequence: [...this.frameBuffer.slice(-30)],
      label: label,
      exercise_type: type,
      user_id: 'local_user'
    };

    this.dataService.saveExercise(exerciseData).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.saveSuccess = true;
        this.saveMessage = '✅ Ejercicio guardado';
        setTimeout(() => this.saveMessage = '', 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveSuccess = false;
        this.saveMessage = '❌ Error al guardar';
        console.error('Save error', err);
        setTimeout(() => this.saveMessage = '', 3000);
      }
    });
  }

  /**
   * Envía keypoints al backend vía WebSocket
   */
  private sendKeypointsToBackend(keypoints: number[][]): void {
    // Verificar que el WebSocket esté conectado
    if (!this.wsService) {
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

    // Actualizar skeleton con keypoints reales
    this.updateSkeletonPositions(keypoints);
    this.updateAngles(keypoints);

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
   * Maneja las predicciones de IA para dar feedback en tiempo real
   */
  private handlePrediction(pred: any): void {
    if (!this.isActive) return;

    this.confidenceValue = Math.round(pred.confidence * 100);
    this.precisionValue = `${this.confidenceValue}%`;

    if (!pred.is_confident) {
      this.currentStatus = 'warning';
      this.currentFeedback = 'Movimiento inestable — estabiliza tu postura.';
      this.correctionTitle = 'Estabilizando...';
      this.correctionIcon = '⚡';
      this.correctionItems = [{
        icon: '🎯',
        label: 'Confianza baja',
        message: 'Muévete más lento y mantén los brazos dentro del cuadro de la cámara.',
        severity: 'warn'
      }];
      return;
    }

    if (pred.classification === 'correcto') {
      this.currentStatus = 'correct';
      this.currentFeedback = '¡Excelente postura! Sigue así.';
      this.correctionTitle = '¡Forma perfecta!';
      this.correctionIcon = '✅';
      if (this.lastClassification === 'incorrecto') {
        this.repsCount++;
      }
    } else {
      this.currentStatus = 'error';
      this.correctionTitle = 'Corregir postura';
      this.correctionIcon = '⚠️';
      // Build summary feedback from angles
      if (this.lastLeftAngle > ANGLE_FULL_EXTENSION || this.lastRightAngle > ANGLE_FULL_EXTENSION) {
        this.currentFeedback = 'Brazos muy extendidos — mantén una ligera flexión.';
      } else if (this.lastLeftAngle < ANGLE_DEEP_FLEX || this.lastRightAngle < ANGLE_DEEP_FLEX) {
        this.currentFeedback = 'Flexión excesiva — extiende un poco más los brazos.';
      } else {
        this.currentFeedback = 'Revisa los ángulos de tus codos y ajusta el ritmo.';
      }
    }

    this.correctionItems = this.buildCorrectionItems(pred.classification);
    this.lastClassification = pred.classification;
  }

  /**
   * Construye la lista de correcciones por brazo según los ángulos actuales
   * y la clasificación del backend.
   */
  private buildCorrectionItems(classification: string): CorrectionItem[] {
    const items: CorrectionItem[] = [];

    // ---- Brazo izquierdo ----
    items.push(this.evalArm('Codo Izquierdo', '💪', this.lastLeftAngle, classification));

    // ---- Brazo derecho ----
    items.push(this.evalArm('Codo Derecho', '💪', this.lastRightAngle, classification));

    // ---- Corrección global si confianza fue baja o movimiento asimétrico ----
    const diff = Math.abs(this.lastLeftAngle - this.lastRightAngle);
    if (diff > 30) {
      items.push({
        icon: '⚖️',
        label: 'Asimetría detectada',
        message: `Diferencia de ${diff}° entre ambos brazos — trata de mantenerlos sincronizados.`,
        severity: 'warn'
      });
    }

    return items;
  }

  /**
   * Evalúa un brazo individual y devuelve un CorrectionItem.
   */
  private evalArm(label: string, icon: string, angle: number, classification: string): CorrectionItem {
    if (classification === 'correcto') {
      return { icon: '✅', label, message: `${angle}° — ¡Ángulo correcto! Sigue así.`, severity: 'ok' };
    }
    if (angle > ANGLE_FULL_EXTENSION) {
      return {
        icon: '🔴',
        label,
        message: `${angle}° — Brazo muy extendido. Mantén una ligera flexión (< ${ANGLE_FULL_EXTENSION}°).`,
        severity: 'error'
      };
    }
    if (angle < ANGLE_DEEP_FLEX) {
      return {
        icon: '🔴',
        label,
        message: `${angle}° — Flexión excesiva. Extiende el brazo un poco más (> ${ANGLE_DEEP_FLEX}°).`,
        severity: 'error'
      };
    }
    if (angle < ANGLE_GOOD_MIN) {
      return {
        icon: '🟡',
        label,
        message: `${angle}° — Casi perfecto. Extiende ligeramente para un rango óptimo (${ANGLE_GOOD_MIN}–${ANGLE_FULL_EXTENSION}°).`,
        severity: 'warn'
      };
    }
    return { icon: '✅', label, message: `${angle}° — Buen rango de movimiento.`, severity: 'ok' };
  }

  /**
   * Limpia recursos
   */
  private cleanup(): void {
    this.stopExercise();
    this.stopSessionTimer();
    this.mediaPipeService.cleanup();
    this.wsService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }
  }

  /**
   * Actualiza las posiciones del skeleton SVG basado en keypoints
   */
  private updateSkeletonPositions(keypoints: number[][]): void {
    if (!keypoints || keypoints.length < 6) return;

    // SVG viewBox dimensions
    const svgWidth = 200;
    const svgHeight = 400;

    // Mapeo de keypoints: [leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist]
    const jointMap = [
      { id: 'joint-left-shoulder', keypoint: keypoints[0] },
      { id: 'joint-left-elbow', keypoint: keypoints[1] },
      { id: 'joint-left-wrist', keypoint: keypoints[2] },
      { id: 'joint-right-shoulder', keypoint: keypoints[3] },
      { id: 'joint-right-elbow', keypoint: keypoints[4] },
      { id: 'joint-right-wrist', keypoint: keypoints[5] }
    ];

    // Actualizar posiciones de joints
    jointMap.forEach(({ id, keypoint }) => {
      if (!keypoint || keypoint.length < 2) return;
      
      const element = document.getElementById(id) as SVGCircleElement | null;
      if (!element) return;

      // KeyPoints están normalizados [0, 1], invertir x porque cámara está flipped
      const x = (1 - keypoint[0]) * svgWidth;
      const y = keypoint[1] * svgHeight;

      // Usar GSAP para animar suavemente
      gsap.to(element, {
        attr: { cx: x, cy: y },
        duration: 0.03,
        overwrite: 'auto'
      });
    });

    // Actualizar líneas conectoras
    this.updateSkeletonLines(keypoints, svgWidth, svgHeight);
  }

  /**
   * Actualiza las líneas conectoras del skeleton
   */
  private updateSkeletonLines(keypoints: number[][], svgWidth: number, svgHeight: number): void {
    const lineMap = [
      { id: 'line-left-shoulder-elbow', start: 0, end: 1 },
      { id: 'line-left-elbow-wrist', start: 1, end: 2 },
      { id: 'line-right-shoulder-elbow', start: 3, end: 4 },
      { id: 'line-right-elbow-wrist', start: 4, end: 5 },
      { id: 'line-shoulders', start: 0, end: 3 }
    ];

    lineMap.forEach(({ id, start, end }) => {
      const line = document.getElementById(id) as SVGLineElement | null;
      if (!line || !keypoints[start] || !keypoints[end]) return;

      const x1 = (1 - keypoints[start][0]) * svgWidth;
      const y1 = keypoints[start][1] * svgHeight;
      const x2 = (1 - keypoints[end][0]) * svgWidth;
      const y2 = keypoints[end][1] * svgHeight;

      gsap.to(line, {
        attr: { x1, y1, x2, y2 },
        duration: 0.03,
        overwrite: 'auto'
      });
    });
  }

  /**
   * Actualiza los ángulos en el DOM en tiempo real
   */
  private updateAngles(keypoints: number[][]): void {
    if (!keypoints || keypoints.length < 6) return;

    // Left Arm (Hombro: 0, Codo: 1, Muñeca: 2)
    const leftShoulder = keypoints[0];
    const leftElbow = keypoints[1];
    const leftWrist = keypoints[2];
    
    // Right Arm (Hombro: 3, Codo: 4, Muñeca: 5)
    const rightShoulder = keypoints[3];
    const rightElbow = keypoints[4];
    const rightWrist = keypoints[5];

    let leftAngle = 0;
    if (leftShoulder && leftElbow && leftWrist) {
      leftAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    }

    let rightAngle = 0;
    if (rightShoulder && rightElbow && rightWrist) {
      rightAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
    }

    this.lastLeftAngle = leftAngle;
    this.lastRightAngle = rightAngle;

    // Actualizar UI
    const leftAngleValue = document.querySelector('.angle-item:first-child .angle-value');
    const leftAngleFill = document.querySelector('.angle-item:first-child .angle-fill') as HTMLElement;
    if (leftAngleValue && leftAngleFill) {
      leftAngleValue.textContent = `${leftAngle}°`;
      leftAngleFill.style.width = `${(leftAngle / 180) * 100}%`;
    }

    const rightAngleValue = document.querySelector('.angle-item:last-child .angle-value');
    const rightAngleFill = document.querySelector('.angle-item:last-child .angle-fill') as HTMLElement;
    if (rightAngleValue && rightAngleFill) {
      rightAngleValue.textContent = `${rightAngle}°`;
      rightAngleFill.style.width = `${(rightAngle / 180) * 100}%`;
    }
  }

  /**
   * Calcula el ángulo entre tres puntos (A, B, C)
   * B es el vértice (ej: codo)
   */
  private calculateAngle(a: number[], b: number[], c: number[]): number {
    const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return Math.round(angle);
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
