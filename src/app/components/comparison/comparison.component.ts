import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import gsap from 'gsap';

Chart.register(...registerables);

interface Exercise {
  exercise_id: string;
  label: number;
  label_name: string;
  exercise_type: string;
  timestamp: string;
  user_id: string;
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('waveformCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartWrapper') chartWrapper!: ElementRef<HTMLDivElement>;

  exercises: Exercise[] = [];
  selectedExercise1: string = '';
  selectedExercise2: string = '';

  exercise1Data: any = null;
  exercise2Data: any = null;

  chart: Chart | null = null;

  isLoading = false;
  errorMessage = '';

  // Export / dataset
  isExporting = false;
  exportMessage = '';
  exportSuccess = false;

  // Dataset stats (shown in header)
  datasetStats: { total: number; correct: number; incorrect: number } = { total: 0, correct: 0, incorrect: 0 };

  // Similarity score (0-100)
  similarityScore: number | null = null;

  // Keypoint names
  keypointNames = [
    'Hombro Izq X', 'Hombro Izq Y', 'Hombro Izq Z',
    'Hombro Der X', 'Hombro Der Y', 'Hombro Der Z',
    'Codo Izq X', 'Codo Izq Y', 'Codo Izq Z',
    'Codo Der X', 'Codo Der Y', 'Codo Der Z',
    'Muñeca Izq X', 'Muñeca Izq Y', 'Muñeca Izq Z',
    'Muñeca Der X', 'Muñeca Der Y', 'Muñeca Der Z'
  ];

  selectedKeypoint = 7; // Codo Izq Y

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadExercises();
    this.loadDatasetStats();
  }

  ngAfterViewInit(): void {
    this.animatePageIn();
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  // ── Animations ──────────────────────────────────────────────────────────────

  private animatePageIn(): void {
    gsap.from('.comp-header', { duration: 0.5, opacity: 0, y: -20, ease: 'power2.out' });
    gsap.from('.stats-bar', { duration: 0.5, opacity: 0, y: -10, delay: 0.1, ease: 'power2.out' });
    gsap.from('.selector-card', {
      duration: 0.45,
      opacity: 0,
      y: 20,
      stagger: 0.12,
      delay: 0.15,
      ease: 'power2.out'
    });
    gsap.from('.actions-bar', { duration: 0.4, opacity: 0, y: 10, delay: 0.3, ease: 'power2.out' });
  }

  private animateChartIn(): void {
    if (!this.chartWrapper?.nativeElement) return;
    gsap.from(this.chartWrapper.nativeElement, {
      duration: 0.5,
      opacity: 0,
      y: 24,
      ease: 'power2.out'
    });
  }

  private animateSelectorCard(selector: string): void {
    const el = document.querySelector(selector);
    if (el) {
      gsap.from(el, { duration: 0.3, opacity: 0, scale: 0.97, ease: 'power2.out' });
    }
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  loadExercises(): void {
    this.isLoading = true;
    this.dataService.listExercises({ limit: 200 }).subscribe({
      next: (response) => {
        this.exercises = response.exercises;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
        this.errorMessage = 'No se pudo conectar con el servidor. Asegúrate de que el backend esté activo.';
        this.isLoading = false;
      }
    });
  }

  loadDatasetStats(): void {
    this.dataService.getDatasetStats().subscribe({
      next: (stats) => {
        this.datasetStats = {
          total: stats.total_exercises,
          correct: stats.correct_exercises,
          incorrect: stats.incorrect_exercises
        };
        // Animate counters
        this.animateCounter('.stat-total', stats.total_exercises);
        this.animateCounter('.stat-correct', stats.correct_exercises);
        this.animateCounter('.stat-incorrect', stats.incorrect_exercises);
      },
      error: () => {}
    });
  }

  private animateCounter(selector: string, target: number): void {
    const el = document.querySelector(selector) as HTMLElement;
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      duration: 1,
      val: target,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val).toString(); }
    });
  }

  // ── Exercise selection ───────────────────────────────────────────────────────

  onExercise1Change(): void {
    if (this.selectedExercise1) {
      this.loadExerciseData(this.selectedExercise1, 1);
    }
  }

  onExercise2Change(): void {
    if (this.selectedExercise2) {
      this.loadExerciseData(this.selectedExercise2, 2);
    }
  }

  loadExerciseData(exerciseId: string, exerciseNumber: 1 | 2): void {
    this.dataService.getExercise(exerciseId).subscribe({
      next: (response) => {
        if (exerciseNumber === 1) {
          this.exercise1Data = response.exercise;
          this.animateSelectorCard('.selector-card:first-child .exercise-badge');
        } else {
          this.exercise2Data = response.exercise;
          this.animateSelectorCard('.selector-card:last-child .exercise-badge');
        }

        if (this.exercise1Data && this.exercise2Data) {
          this.computeSimilarity();
          setTimeout(() => {
            this.createWaveformChart();
            this.animateChartIn();
          }, 80);
        }
      },
      error: (error) => {
        console.error('Error al cargar ejercicio:', error);
        this.errorMessage = 'Error al cargar datos del ejercicio';
      }
    });
  }

  onKeypointChange(): void {
    if (this.exercise1Data && this.exercise2Data) {
      this.createWaveformChart();
    }
  }

  // ── Chart ────────────────────────────────────────────────────────────────────

  createWaveformChart(): void {
    if (!this.canvasRef) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const seq1 = this.exercise1Data.sequence as number[][];
    const seq2 = this.exercise2Data.sequence as number[][];

    const data1 = seq1.map(frame => frame[this.selectedKeypoint]);
    const data2 = seq2.map(frame => frame[this.selectedKeypoint]);
    const labels = Array.from({ length: 30 }, (_, i) => `F${i + 1}`);

    const color1 = this.exercise1Data.label === 1 ? '#22C55E' : '#EF4444';
    const color2 = this.exercise2Data.label === 1 ? '#22C55E' : '#EF4444';
    const bg1 = this.exercise1Data.label === 1 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
    const bg2 = this.exercise2Data.label === 1 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Ej 1 · ${this.exercise1Data.label_name.toUpperCase()}`,
            data: data1,
            borderColor: color1,
            backgroundColor: bg1,
            borderWidth: 2.5,
            tension: 0.45,
            pointRadius: 3,
            pointHoverRadius: 7,
            fill: true
          },
          {
            label: `Ej 2 · ${this.exercise2Data.label_name.toUpperCase()}`,
            data: data2,
            borderColor: color2,
            backgroundColor: bg2,
            borderWidth: 2.5,
            tension: 0.45,
            pointRadius: 3,
            pointHoverRadius: 7,
            borderDash: [6, 3],
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 700,
          easing: 'easeInOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: `📈 ${this.keypointNames[this.selectedKeypoint]}`,
            color: '#e2e8f0',
            font: { size: 15, weight: 'bold', family: 'Outfit' },
            padding: { bottom: 16 }
          },
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 12 }, usePointStyle: true, padding: 16 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(15,20,40,0.92)',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(123,47,214,0.3)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(4) : 'N/A'}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' }
          },
          y: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' }
          }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  // ── Similarity score ─────────────────────────────────────────────────────────

  computeSimilarity(): void {
    const seq1 = this.exercise1Data.sequence as number[][];
    const seq2 = this.exercise2Data.sequence as number[][];

    let totalDiff = 0;
    let maxPossible = 0;

    for (let f = 0; f < 30; f++) {
      for (let k = 0; k < 18; k++) {
        const diff = Math.abs(seq1[f][k] - seq2[f][k]);
        totalDiff += diff;
        maxPossible += 1; // coordinates normalised roughly [0,1]
      }
    }

    // similarity 0-100 (lower diff = higher similarity)
    const raw = 1 - (totalDiff / (maxPossible * 0.5));
    this.similarityScore = Math.max(0, Math.min(100, Math.round(raw * 100)));

    // Animate the score
    const el = document.querySelector('.similarity-value') as HTMLElement;
    if (el) {
      const obj = { val: 0 };
      gsap.to(obj, {
        duration: 0.8,
        val: this.similarityScore,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = `${Math.round(obj.val)}%`; }
      });
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getLabelColor(label: number): string {
    return label === 1 ? '#22C55E' : '#EF4444';
  }

  getLabelBg(label: number): string {
    return label === 1 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString('es-ES', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getSimilarityColor(): string {
    if (this.similarityScore === null) return '#64748b';
    if (this.similarityScore >= 70) return '#22C55E';
    if (this.similarityScore >= 40) return '#EAB308';
    return '#EF4444';
  }

  // ── Export dataset ───────────────────────────────────────────────────────────

  exportDataset(): void {
    this.isExporting = true;
    this.exportMessage = '';

    this.dataService.exportDataset().subscribe({
      next: (response) => {
        this.isExporting = false;
        this.exportSuccess = true;
        const info = response.info;
        this.exportMessage = `Dataset exportado — ${info.total_samples} muestras (${info.class_distribution.correct} correctas / ${info.class_distribution.incorrect} incorrectas)`;
        this.loadDatasetStats();
        setTimeout(() => { this.exportMessage = ''; }, 8000);
      },
      error: (error) => {
        this.isExporting = false;
        this.exportSuccess = false;
        this.exportMessage = `Error al exportar: ${error.message || 'Error desconocido'}`;
        setTimeout(() => { this.exportMessage = ''; }, 5000);
      }
    });
  }
}
