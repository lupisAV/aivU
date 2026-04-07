import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      size="small"
      (closed)="handleCancel()">
      <div class="confirmation-content">
        <div class="confirmation-icon" [class]="'icon-' + severity">
          {{ getIcon() }}
        </div>
        <p class="confirmation-message">{{ message }}</p>
        <p class="confirmation-detail" *ngIf="detail">{{ detail }}</p>
      </div>

      <div class="confirmation-actions">
        <button 
          type="button"
          class="btn btn-secondary"
          (click)="handleCancel()">
          {{ cancelText }}
        </button>
        <button 
          type="button"
          [class]="'btn btn-' + (severity === 'danger' ? 'danger' : 'primary')"
          (click)="handleConfirm()">
          {{ confirmText }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirmation-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2rem 1rem 1rem;
    }

    .confirmation-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      animation: pulse 0.5s ease-out;
    }

    .icon-info {
      color: var(--accent-violet);
    }

    .icon-warning {
      color: var(--status-yellow);
    }

    .icon-danger {
      color: var(--status-red);
    }

    .icon-success {
      color: var(--status-green);
    }

    .confirmation-message {
      font-size: 1.1rem;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
      font-weight: 600;
    }

    .confirmation-detail {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin: 0;
    }

    .confirmation-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .btn-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid rgba(123, 47, 214, 0.2);
    }

    .btn-secondary:hover {
      border-color: var(--accent-violet);
      background: rgba(123, 47, 214, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-violet-light) 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(123, 47, 214, 0.3);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: var(--status-red);
      border: 1px solid var(--status-red);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
    }

    @keyframes pulse {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = '¿Confirmar acción?';
  @Input() message = 'Por favor, confirma esta acción.';
  @Input() detail?: string;
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() severity: 'info' | 'warning' | 'danger' | 'success' = 'info';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  handleConfirm() {
    this.confirmed.emit();
  }

  handleCancel() {
    this.cancelled.emit();
  }

  getIcon(): string {
    const icons = {
      info: 'ⓘ',
      warning: '⚠',
      danger: '✕',
      success: '✓'
    };
    return icons[this.severity];
  }
}
