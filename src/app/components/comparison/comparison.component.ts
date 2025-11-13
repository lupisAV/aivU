import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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
export class ComparisonComponent implements OnInit, AfterViewInit {
  @ViewChild('waveformCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  exercises: Exercise[] = [];
  selectedExercise1: string = '';
  selectedExercise2: string = '';
  
  exercise1Data: any = null;
  exercise2Data: any = null;
  
  chart: Chart | null = null;
  
  isLoading = false;
  errorMessage = '';
  
  // Estado de exportación
  isExporting = false;
  exportMessage = '';
  exportSuccess = false;
  
  // Nombres de los keypoints
  keypointNames = [
    'Hombro Izq X', 'Hombro Izq Y', 'Hombro Izq Z',
    'Hombro Der X', 'Hombro Der Y', 'Hombro Der Z',
    'Codo Izq X', 'Codo Izq Y', 'Codo Izq Z',
    'Codo Der X', 'Codo Der Y', 'Codo Der Z',
    'Muñeca Izq X', 'Muñeca Izq Y', 'Muñeca Izq Z',
    'Muñeca Der X', 'Muñeca Der Y', 'Muñeca Der Z'
  ];
  
  selectedKeypoint = 7; // Codo Izq Y por defecto

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadExercises();
  }

  ngAfterViewInit(): void {
    // El chart se creará cuando se seleccionen ejercicios
  }

  /**
   * Carga la lista de ejercicios
   */
  loadExercises(): void {
    this.isLoading = true;
    this.dataService.listExercises({ limit: 100 }).subscribe({
      next: (response) => {
        this.exercises = response.exercises;
        this.isLoading = false;
        console.log('Ejercicios cargados:', this.exercises.length);
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
        this.errorMessage = 'Error al cargar ejercicios';
        this.isLoading = false;
      }
    });
  }

  /**
   * Cuando se selecciona el ejercicio 1
   */
  onExercise1Change(): void {
    if (this.selectedExercise1) {
      this.loadExerciseData(this.selectedExercise1, 1);
    }
  }

  /**
   * Cuando se selecciona el ejercicio 2
   */
  onExercise2Change(): void {
    if (this.selectedExercise2) {
      this.loadExerciseData(this.selectedExercise2, 2);
    }
  }

  /**
   * Carga los datos de un ejercicio específico
   */
  loadExerciseData(exerciseId: string, exerciseNumber: 1 | 2): void {
    this.dataService.getExercise(exerciseId).subscribe({
      next: (response) => {
        if (exerciseNumber === 1) {
          this.exercise1Data = response.exercise;
        } else {
          this.exercise2Data = response.exercise;
        }
        
        // Si ambos ejercicios están cargados, crear gráfica
        if (this.exercise1Data && this.exercise2Data) {
          this.createWaveformChart();
        }
      },
      error: (error) => {
        console.error('Error al cargar ejercicio:', error);
        this.errorMessage = 'Error al cargar datos del ejercicio';
      }
    });
  }

  /**
   * Cambia el keypoint a visualizar
   */
  onKeypointChange(): void {
    if (this.exercise1Data && this.exercise2Data) {
      this.createWaveformChart();
    }
  }

  /**
   * Crea la gráfica de ondas
   */
  createWaveformChart(): void {
    if (!this.canvasRef) {
      return;
    }

    // Destruir gráfica anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    // Extraer datos del keypoint seleccionado
    const sequence1 = this.exercise1Data.sequence;
    const sequence2 = this.exercise2Data.sequence;
    
    const data1 = sequence1.map((frame: number[]) => frame[this.selectedKeypoint]);
    const data2 = sequence2.map((frame: number[]) => frame[this.selectedKeypoint]);
    
    // Crear labels (frames 1-30)
    const labels = Array.from({ length: 30 }, (_, i) => `Frame ${i + 1}`);

    // Configuración de la gráfica
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${this.exercise1Data.label_name.toUpperCase()} - ${this.exercise1Data.exercise_type}`,
            data: data1,
            borderColor: this.exercise1Data.label === 1 ? '#10B981' : '#EF4444',
            backgroundColor: this.exercise1Data.label === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: `${this.exercise2Data.label_name.toUpperCase()} - ${this.exercise2Data.exercise_type}`,
            data: data2,
            borderColor: this.exercise2Data.label === 1 ? '#10B981' : '#EF4444',
            backgroundColor: this.exercise2Data.label === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5] // Línea punteada para diferenciar
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Comparación: ${this.keypointNames[this.selectedKeypoint]}`,
            font: {
              size: 18,
              weight: 'bold'
            },
            color: '#111827'
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 12
              },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value !== null ? value.toFixed(4) : 'N/A'}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Frames (Tiempo)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor de Coordenada',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  /**
   * Obtiene el color según la etiqueta
   */
  getLabelColor(label: number): string {
    return label === 1 ? '#10B981' : '#EF4444';
  }

  /**
   * Formatea la fecha
   */
  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Exporta el dataset para entrenamiento
   */
  exportDataset(): void {
    this.isExporting = true;
    this.exportMessage = '';
    
    this.dataService.exportDataset().subscribe({
      next: (response) => {
        this.isExporting = false;
        this.exportSuccess = true;
        
        const info = response.info;
        this.exportMessage = `✅ Dataset exportado exitosamente!\n` +
          `📊 Total: ${info.total_samples} ejercicios\n` +
          `📈 Shape: ${info.shape.join(' × ')}\n` +
          `✓ Correctos: ${info.class_distribution.correct}\n` +
          `✗ Incorrectos: ${info.class_distribution.incorrect}\n` +
          `📁 Archivo: ${info.output_path}`;
        
        console.log('Dataset exportado:', response);
        
        // Limpiar mensaje después de 10 segundos
        setTimeout(() => {
          this.exportMessage = '';
        }, 10000);
      },
      error: (error) => {
        this.isExporting = false;
        this.exportSuccess = false;
        this.exportMessage = `❌ Error al exportar dataset: ${error.message || 'Error desconocido'}`;
        console.error('Error al exportar:', error);
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          this.exportMessage = '';
        }, 5000);
      }
    });
  }
}
