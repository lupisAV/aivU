import { Injectable } from '@angular/core';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { Subject } from 'rxjs';

export interface ArmKeypoints {
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  leftElbow: { x: number; y: number; z: number };
  rightElbow: { x: number; y: number; z: number };
  leftWrist: { x: number; y: number; z: number };
  rightWrist: { x: number; y: number; z: number };
}

@Injectable({
  providedIn: 'root'
})
export class MediaPipeService {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  
  // Observable para emitir resultados de pose
  private poseResultsSubject = new Subject<Results>();
  public poseResults$ = this.poseResultsSubject.asObservable();
  
  // Observable para emitir keypoints de brazos
  private armKeypointsSubject = new Subject<number[][]>();
  public armKeypoints$ = this.armKeypointsSubject.asObservable();
  
  private isInitialized = false;
  private isRunning = false;

  // Índices de MediaPipe Pose para brazos
  private readonly ARM_KEYPOINT_INDICES = {
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16
  };

  constructor() {}

  /**
   * Inicializa MediaPipe Pose
   */
  async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<void> {
    if (this.isInitialized) {
      console.log('MediaPipe ya está inicializado');
      return;
    }

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');

    if (!this.canvasCtx) {
      throw new Error('No se pudo obtener el contexto del canvas');
    }

    // Configurar MediaPipe Pose
    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults((results) => this.onResults(results));

    this.isInitialized = true;
    console.log('✅ MediaPipe inicializado');
  }

  /**
   * Inicia la captura de video
   */
  async startCamera(): Promise<void> {
    if (!this.isInitialized || !this.videoElement || !this.pose) {
      throw new Error('MediaPipe no está inicializado');
    }

    if (this.isRunning) {
      console.log('La cámara ya está corriendo');
      return;
    }

    try {
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (this.pose && this.videoElement) {
            await this.pose.send({ image: this.videoElement });
          }
        },
        width: 1280,
        height: 720
      });

      await this.camera.start();
      this.isRunning = true;
      console.log('✅ Cámara iniciada');
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
      throw new Error('No se pudo acceder a la cámara');
    }
  }

  /**
   * Detiene la captura de video
   */
  stopCamera(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
      this.isRunning = false;
      console.log('🛑 Cámara detenida');
    }
  }

  /**
   * Procesa los resultados de MediaPipe
   */
  private onResults(results: Results): void {
    if (!this.canvasCtx || !this.canvasElement) {
      return;
    }

    // Limpiar canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Dibujar imagen de video
    this.canvasCtx.drawImage(
      results.image,
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    // Dibujar landmarks si existen
    if (results.poseLandmarks) {
      this.drawLandmarks(results.poseLandmarks);
      this.drawConnections(results.poseLandmarks);
      
      // Extraer keypoints de brazos
      const armKeypoints = this.extractArmKeypoints(results.poseLandmarks);
      if (armKeypoints) {
        this.armKeypointsSubject.next(armKeypoints);
      }
    }

    this.canvasCtx.restore();
    
    // Emitir resultados completos
    this.poseResultsSubject.next(results);
  }

  /**
   * Extrae los keypoints de los brazos en el formato esperado por el backend
   */
  private extractArmKeypoints(landmarks: any[]): number[][] | null {
    try {
      const keypoints = [
        landmarks[this.ARM_KEYPOINT_INDICES.LEFT_SHOULDER],
        landmarks[this.ARM_KEYPOINT_INDICES.RIGHT_SHOULDER],
        landmarks[this.ARM_KEYPOINT_INDICES.LEFT_ELBOW],
        landmarks[this.ARM_KEYPOINT_INDICES.RIGHT_ELBOW],
        landmarks[this.ARM_KEYPOINT_INDICES.LEFT_WRIST],
        landmarks[this.ARM_KEYPOINT_INDICES.RIGHT_WRIST]
      ];

      // Verificar que todos los keypoints existen
      if (keypoints.some(kp => !kp)) {
        return null;
      }

      // Convertir al formato [x, y, z]
      return keypoints.map(kp => [kp.x, kp.y, kp.z]);
    } catch (error) {
      console.error('Error al extraer keypoints:', error);
      return null;
    }
  }

  /**
   * Obtiene los keypoints de brazos como objeto estructurado
   */
  getArmKeypointsObject(landmarks: any[]): ArmKeypoints | null {
    try {
      return {
        leftShoulder: landmarks[this.ARM_KEYPOINT_INDICES.LEFT_SHOULDER],
        rightShoulder: landmarks[this.ARM_KEYPOINT_INDICES.RIGHT_SHOULDER],
        leftElbow: landmarks[this.ARM_KEYPOINT_INDICES.LEFT_ELBOW],
        rightElbow: landmarks[this.ARM_KEYPOINT_INDICES.RIGHT_ELBOW],
        leftWrist: landmarks[this.ARM_KEYPOINT_INDICES.LEFT_WRIST],
        rightWrist: landmarks[this.ARM_KEYPOINT_INDICES.RIGHT_WRIST]
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Dibuja los landmarks en el canvas
   */
  private drawLandmarks(landmarks: any[]): void {
    if (!this.canvasCtx) return;

    // Dibujar solo los keypoints de brazos
    const armIndices = Object.values(this.ARM_KEYPOINT_INDICES);
    
    landmarks.forEach((landmark, index) => {
      if (armIndices.includes(index)) {
        const x = landmark.x * this.canvasElement!.width;
        const y = landmark.y * this.canvasElement!.height;

        this.canvasCtx!.beginPath();
        this.canvasCtx!.arc(x, y, 8, 0, 2 * Math.PI);
        this.canvasCtx!.fillStyle = '#00FF00';
        this.canvasCtx!.fill();
        this.canvasCtx!.strokeStyle = '#FFFFFF';
        this.canvasCtx!.lineWidth = 2;
        this.canvasCtx!.stroke();
      }
    });
  }

  /**
   * Dibuja las conexiones entre landmarks
   */
  private drawConnections(landmarks: any[]): void {
    if (!this.canvasCtx) return;

    // Conexiones de brazos
    const armConnections = [
      [11, 13], // Hombro izq -> Codo izq
      [13, 15], // Codo izq -> Muñeca izq
      [12, 14], // Hombro der -> Codo der
      [14, 16], // Codo der -> Muñeca der
      [11, 12]  // Hombro izq -> Hombro der
    ];

    this.canvasCtx.strokeStyle = '#00FF00';
    this.canvasCtx.lineWidth = 3;

    armConnections.forEach(([start, end]) => {
      const startLandmark = landmarks[start];
      const endLandmark = landmarks[end];

      if (startLandmark && endLandmark) {
        const startX = startLandmark.x * this.canvasElement!.width;
        const startY = startLandmark.y * this.canvasElement!.height;
        const endX = endLandmark.x * this.canvasElement!.width;
        const endY = endLandmark.y * this.canvasElement!.height;

        this.canvasCtx!.beginPath();
        this.canvasCtx!.moveTo(startX, startY);
        this.canvasCtx!.lineTo(endX, endY);
        this.canvasCtx!.stroke();
      }
    });
  }

  /**
   * Verifica si MediaPipe está corriendo
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Limpia recursos
   */
  cleanup(): void {
    this.stopCamera();
    
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }

    this.isInitialized = false;
    console.log('🧹 MediaPipe limpiado');
  }
}
