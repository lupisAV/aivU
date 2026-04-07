import { Component, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container">
      <div 
        *ngFor="let item of getSkeletonArray()"
        [class]="'skeleton skeleton-' + variant"
        [style.width.%]="getRandomWidth()">
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton {
      background: linear-gradient(90deg, 
        rgba(123, 47, 214, 0.1) 0%,
        rgba(123, 47, 214, 0.2) 50%,
        rgba(123, 47, 214, 0.1) 100%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton-text {
      height: 1rem;
      width: 100%;
      border-radius: 4px;
    }

    .skeleton-heading {
      height: 1.5rem;
      width: 60%;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .skeleton-card {
      height: 200px;
      width: 100%;
      border-radius: 12px;
    }

    .skeleton-avatar {
      height: 40px;
      width: 40px;
      border-radius: 50%;
    }

    .skeleton-button {
      height: 42px;
      width: 100%;
      border-radius: 10px;
    }

    .skeleton-table-row {
      height: 48px;
      width: 100%;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
  `]
})
export class SkeletonLoaderComponent implements AfterViewInit {
  @Input() count = 3;
  @Input() variant: 'text' | 'heading' | 'card' | 'avatar' | 'button' | 'table-row' = 'text';

  getSkeletonArray(): any[] {
    return new Array(this.count);
  }

  getRandomWidth(): number {
    return Math.random() * 40 + 60; // Entre 60% y 100%
  }

  ngAfterViewInit() {
    // Las animaciones de skeleton están en CSS con keyframes
    // No es necesario GSAP para este componente
  }
}
