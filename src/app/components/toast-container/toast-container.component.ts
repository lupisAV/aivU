import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackService, Toast } from '../../services/feedback.service';
import gsap from 'gsap';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [class]="'toast-' + toast.type"
        role="alert"
        aria-live="polite">
        <div class="toast-icon">
          {{ getIconForType(toast.type) }}
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ toast.message }}</p>
          <div class="toast-progress" *ngIf="toast.duration && toast.duration > 0"
            [style.animation-duration.ms]="toast.duration">
          </div>
        </div>
        <button
          class="toast-close"
          (click)="dismissToast(toast.id)"
          aria-label="Cerrar notificación">
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      pointer-events: auto;
      max-width: 400px;
      min-width: 280px;
      overflow: hidden;
      position: relative;
    }

    .toast-success {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .toast-error {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
    }

    .toast-info {
      background: rgba(56, 189, 248, 0.1);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .toast-warning {
      background: rgba(234, 179, 8, 0.1);
      border-color: rgba(234, 179, 8, 0.3);
    }

    .toast-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .toast-message {
      color: var(--text-primary);
      font-size: 0.95rem;
      line-height: 1.4;
      margin: 0;
    }

    .toast-progress {
      height: 2px;
      background: linear-gradient(90deg, var(--accent-violet), transparent);
      margin-top: 8px;
      animation: shrink linear forwards;
    }

    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      flex-shrink: 0;
      transition: color 0.3s ease;
    }

    .toast-close:hover {
      color: var(--text-primary);
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit() {
    this.feedbackService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
      // Animar el último toast que se agregó
      setTimeout(() => {
        const toastElements = document.querySelectorAll('.toast');
        const lastToast = toastElements[toastElements.length - 1];
        if (lastToast) {
          gsap.from(lastToast, {
            duration: 0.3,
            x: 400,
            opacity: 0,
            ease: 'power2.out'
          });
        }
      });
    });
  }

  dismissToast(id: string) {
    this.feedbackService.removeToast(id);
  }

  getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      success: '✓',
      error: '✕',
      info: 'ⓘ',
      warning: '⚠'
    };
    return icons[type] || 'ⓘ';
  }
}
