import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SaveExerciseData {
  label: number;
  exerciseType: string;
  notes: string;
}

@Component({
  selector: 'app-save-exercise-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './save-exercise-modal.component.html',
  styleUrls: ['./save-exercise-modal.component.css']
})
export class SaveExerciseModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<SaveExerciseData>();

  selectedLabel: number | null = null;
  exerciseType = 'bicep_curl';
  notes = '';
  isSaving = false;

  exerciseTypes = [
    { value: 'bicep_curl', label: 'Curl de Bíceps' },
    { value: 'shoulder_press', label: 'Press de Hombros' },
    { value: 'lateral_raise', label: 'Elevación Lateral' },
    { value: 'front_raise', label: 'Elevación Frontal' },
    { value: 'other', label: 'Otro' }
  ];

  /**
   * Selecciona la etiqueta (correcto/incorrecto)
   */
  selectLabel(label: number): void {
    this.selectedLabel = label;
  }

  /**
   * Guarda el ejercicio
   */
  onSave(): void {
    if (this.selectedLabel === null) {
      return;
    }

    this.isSaving = true;

    this.save.emit({
      label: this.selectedLabel,
      exerciseType: this.exerciseType,
      notes: this.notes
    });

    // Resetear después de un delay
    setTimeout(() => {
      this.resetForm();
      this.isSaving = false;
    }, 500);
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  /**
   * Resetea el formulario
   */
  private resetForm(): void {
    this.selectedLabel = null;
    this.exerciseType = 'bicep_curl';
    this.notes = '';
  }

  /**
   * Maneja el click en el backdrop
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
