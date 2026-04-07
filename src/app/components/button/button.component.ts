import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'btn btn-' + (variant || 'primary')"
      [disabled]="disabled"
      (click)="handleClick()"
      [attr.aria-label]="ariaLabel"
      [attr.type]="type">
      <span class="btn-icon" *ngIf="icon">{{ icon }}</span>
      <span class="btn-text">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: inherit;
      position: relative;
      overflow: hidden;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Primary Button */
    .btn-primary {
      background: linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-violet-light) 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(123, 47, 214, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(123, 47, 214, 0.4);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    /* Secondary Button */
    .btn-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 2px solid var(--accent-violet);
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(123, 47, 214, 0.1);
      box-shadow: 0 0 20px rgba(123, 47, 214, 0.3);
    }

    /* Danger Button */
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: var(--status-red);
      border: 1px solid var(--status-red);
    }

    .btn-danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.25);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
    }

    /* Success Button */
    .btn-success {
      background: rgba(34, 197, 94, 0.15);
      color: var(--status-green);
      border: 1px solid var(--status-green);
    }

    .btn-success:hover:not(:disabled) {
      background: rgba(34, 197, 94, 0.25);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
    }

    /* Text Button */
    .btn-text {
      background: none;
      color: var(--accent-violet);
      text-decoration: underline;
    }

    .btn-text:hover:not(:disabled) {
      color: var(--accent-violet-light);
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .btn-text {
      margin: 0;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' | 'text' = 'primary';
  @Input() icon?: string;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel?: string;
  @Output() clicked = new EventEmitter<void>();

  handleClick() {
    this.clicked.emit();
  }
}
