import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" 
         *ngIf="isOpen" 
         (click)="dismissModal()"
         role="presentation">
      <div class="modal" 
           [class]="'modal-' + (size || 'medium')"
           (click)="$event.stopPropagation()"
           role="dialog"
           [attr.aria-modal]="true"
           [attr.aria-labelledby]="headerId">
        <div class="modal-header" *ngIf="title" [id]="headerId">
          <h2 class="modal-title">{{ title }}</h2>
          <button 
            class="modal-close"
            (click)="dismissModal()"
            aria-label="Cerrar modal"
            type="button">
            ✕
          </button>
        </div>
        
        <div class="modal-body">
          <ng-content></ng-content>
        </div>

        <div class="modal-footer" *ngIf="showFooter">
          <button 
            class="btn btn-secondary"
            (click)="dismissModal()"
            type="button">
            {{ cancelText }}
          </button>
          <button 
            class="btn btn-primary"
            (click)="confirm()"
            type="button">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    }

    .modal {
      background: var(--bg-elevated);
      border: 1px solid rgba(123, 47, 214, 0.2);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(123, 47, 214, 0.1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-small {
      width: 90%;
      max-width: 400px;
    }

    .modal-medium {
      width: 90%;
      max-width: 600px;
    }

    .modal-large {
      width: 90%;
      max-width: 900px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(123, 47, 214, 0.1);
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Outfit', sans-serif;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.5rem;
      transition: color 0.3s ease;
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-body {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid rgba(123, 47, 214, 0.1);
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

    .btn-primary {
      background: linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-violet-light) 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(123, 47, 214, 0.3);
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
  `]
})
export class ModalComponent implements AfterViewInit {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showFooter = false;
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  headerId = `modal-header-${Math.random()}`

  ngAfterViewInit() {
    if (this.isOpen) {
      this.animateModal();
    }
  }

  private animateModal() {
    const overlay = document.querySelector('.modal-overlay');
    const modal = document.querySelector('.modal');
    if (overlay && modal) {
      gsap.from(overlay, {
        duration: 0.2,
        opacity: 0,
        ease: 'power2.out'
      });
      gsap.from(modal, {
        duration: 0.3,
        y: 30,
        opacity: 0,
        ease: 'power2.out'
      });
    }
  }

  dismissModal() {
    this.closed.emit();
  }

  confirm() {
    this.confirmed.emit();
  }
}
