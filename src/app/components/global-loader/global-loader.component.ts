import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';
import gsap from 'gsap';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="isLoading" role="status" aria-live="polite">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="loader-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
    }

    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(123, 47, 214, 0.2);
      border-top-color: var(--accent-violet);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loader-message {
      color: var(--text-primary);
      font-size: 1rem;
      margin: 0;
      text-align: center;
    }
  `]
})
export class GlobalLoaderComponent implements OnInit {
  isLoading = false;
  message = '';

  constructor(private loadingService: LoadingService) {}

  ngOnInit() {
    this.loadingService.getLoadingState().subscribe(state => {
      this.isLoading = state;
      if (state) {
        setTimeout(() => {
          const overlay = document.querySelector('.loader-overlay');
          if (overlay) {
            gsap.from(overlay, {
              duration: 0.2,
              opacity: 0,
              ease: 'power2.out'
            });
          }
        });
      }
    });

    this.loadingService.getLoadingMessage().subscribe(msg => {
      this.message = msg;
    });
  }
}
