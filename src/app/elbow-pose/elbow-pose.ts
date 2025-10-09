import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Pose, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-elbow-pose',
  standalone: true,
  imports: [NgClass],
  templateUrl: './elbow-pose.html',
  styleUrls: ['./elbow-pose.css']
})
export class ElbowPoseComponent implements AfterViewInit {
  constructor(private router: Router) {}
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasRef!: ElementRef<HTMLCanvasElement>;

  leftElbowAngle = 0;
  rightElbowAngle = 0;
  leftStatus = '—';
  rightStatus = '—';
  leftStatusClass = '';
  rightStatusClass = '';

  optimalMin = 45;
  optimalMax = 58;
  optimalReps = 0;

  private wasInOptimalRange = false;
  showingSessionComplete = false;

  private pose!: Pose;
  private camera?: Camera;
  isCameraRunning = false;

  ngAfterViewInit(): void {
    this.setupPose();
  }

  async toggleCamera() {
    if (this.isCameraRunning) {
      await this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  private async startCamera() {
    try {
      await this.camera?.start();
      this.isCameraRunning = true;
    } catch (err) {
      console.error('No se pudo iniciar la cámara:', err);
      alert('Revisa permisos de cámara.');
    }
  }

  private async stopCamera() {
    try {
      await this.camera?.stop();
      this.isCameraRunning = false;
    } catch (err) {
      console.error('Error al detener la cámara:', err);
    }
  }

  private setupPose() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.pose.onResults((results: Results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.image) return;

      ctx.drawImage(results.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        const lm = results.poseLandmarks;

        // Constantes para los índices de los puntos
        const LEFT_SHOULDER = 11;
        const LEFT_ELBOW = 13;
        const LEFT_WRIST = 15;
        const RIGHT_SHOULDER = 12;
        const RIGHT_ELBOW = 14;
        const RIGHT_WRIST = 16;

        // Dibujar todos los puntos de referencia
        ctx.fillStyle = '#3182ce';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        results.poseLandmarks.forEach((landmark, index) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          const z = landmark.z;
          
          // Ajustar el tamaño del punto según la profundidad (z)
          const size = Math.max(5, 10 * (1 - Math.abs(z)));
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });

        // Dibujar conexiones para los brazos
        ctx.strokeStyle = '#3182ce';
        ctx.lineWidth = 3;

        // Conexiones del brazo izquierdo
        this.drawConnection(ctx, lm[LEFT_SHOULDER], lm[LEFT_ELBOW], canvas);
        this.drawConnection(ctx, lm[LEFT_ELBOW], lm[LEFT_WRIST], canvas);

        // Conexiones del brazo derecho
        this.drawConnection(ctx, lm[RIGHT_SHOULDER], lm[RIGHT_ELBOW], canvas);
        this.drawConnection(ctx, lm[RIGHT_ELBOW], lm[RIGHT_WRIST], canvas);

        // Conexión entre hombros
        this.drawConnection(ctx, lm[LEFT_SHOULDER], lm[RIGHT_SHOULDER], canvas);

        if (lm[LEFT_SHOULDER] && lm[LEFT_ELBOW] && lm[LEFT_WRIST]) {
          const a = this.toPoint(lm[LEFT_SHOULDER], canvas);
          const b = this.toPoint(lm[LEFT_ELBOW], canvas);
          const c = this.toPoint(lm[LEFT_WRIST], canvas);
          const angleL = this.angleBetweenThreePoints(a, b, c);
          this.leftElbowAngle = angleL;
          const leftOk = this.isOptimal(angleL);
          this.leftStatus = leftOk ? 'ÓPTIMA' : 'NO ÓPTIMA';
          this.leftStatusClass = leftOk ? 'ok' : 'bad';
          this.drawAngleText(ctx, b.x, b.y, angleL);
          this.checkForRepetition(angleL);
        }

        if (lm[RIGHT_SHOULDER] && lm[RIGHT_ELBOW] && lm[RIGHT_WRIST]) {
          const a = this.toPoint(lm[RIGHT_SHOULDER], canvas);
          const b = this.toPoint(lm[RIGHT_ELBOW], canvas);
          const c = this.toPoint(lm[RIGHT_WRIST], canvas);
          const angleR = this.angleBetweenThreePoints(a, b, c);
          this.rightElbowAngle = angleR;
          const rightOk = this.isOptimal(angleR);
          this.rightStatus = rightOk ? 'ÓPTIMA' : 'NO ÓPTIMA';
          this.rightStatusClass = rightOk ? 'ok' : 'bad';
          this.drawAngleText(ctx, b.x, b.y, angleR);
        }
      }
    });

    this.camera = new Camera(video, {
      onFrame: async () => {
        await this.pose.send({ image: video });
      },
      width: 1280,
      height: 720,
    });

    this.camera.start().catch(err => {
      console.error('No se pudo iniciar la cámara:', err);
      alert('Revisa permisos de cámara.');
    });
  }

  private toPoint(landmark: { x: number; y: number }, canvas: HTMLCanvasElement) {
    return {
      x: landmark.x * canvas.width,
      y: landmark.y * canvas.height,
    };
  }

  private angleBetweenThreePoints(A: any, B: any, C: any): number {
    const BAx = A.x - B.x, BAy = A.y - B.y;
    const BCx = C.x - B.x, BCy = C.y - B.y;
    const dot = BAx * BCx + BAy * BCy;
    const magBA = Math.hypot(BAx, BAy);
    const magBC = Math.hypot(BCx, BCy);
    if (magBA === 0 || magBC === 0) return 0;
    let cos = dot / (magBA * magBC);
    cos = Math.max(-1, Math.min(1, cos));
    return Math.round((Math.acos(cos) * 180 / Math.PI) * 10) / 10;
  }

  private isOptimal(angle: number) {
    return angle >= this.optimalMin && angle <= this.optimalMax;
  }

  private drawConnection(
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number },
    canvas: HTMLCanvasElement
  ) {
    ctx.beginPath();
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    ctx.stroke();
  }

  private drawAngleText(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.font = '18px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(`${angle.toFixed(1)}°`, x + 8, y - 8);
    ctx.fillText(`${angle.toFixed(1)}°`, x + 8, y - 8);
    ctx.restore();
  }

  private checkForRepetition(angle: number) {
    const isInOptimalRange = angle >= this.optimalMin && angle <= this.optimalMax;
    
    if (isInOptimalRange && !this.wasInOptimalRange) {
      // Acaba de entrar en el rango óptimo
      this.optimalReps++;
      this.wasInOptimalRange = true;
    } else if (!isInOptimalRange) {
      // Salió del rango óptimo
      this.wasInOptimalRange = false;
    }
  }

  async endSession() {
    if (this.isCameraRunning) {
      await this.stopCamera();
    }

    this.showingSessionComplete = true;

    // Esperar 2 segundos y luego navegar al home
    setTimeout(() => {
      this.showingSessionComplete = false;
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 300);
    }, 2000);
  }
}
