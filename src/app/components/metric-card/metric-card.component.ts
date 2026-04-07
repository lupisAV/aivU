import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card" [class]="'metric-' + (theme || 'default')">
      <div class="metric-header">
        <div class="metric-icon" *ngIf="icon">{{ icon }}</div>
        <div class="metric-title">{{ title }}</div>
      </div>
      <div class="metric-body">
        <div class="metric-value">{{ value }}</div>
        <div class="metric-label" *ngIf="label">{{ label }}</div>
      </div>
      <div class="metric-footer" *ngIf="footer">{{ footer }}</div>
    </div>
  `,
  styles: [`
    .metric-card {
      display: flex;
      flex-direction: column;
      padding: 1.2rem;
      background: var(--bg-card);
      border: 1px solid rgba(123, 47, 214, 0.2);
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      border-color: var(--accent-violet);
      box-shadow: 0 4px 12px rgba(123, 47, 214, 0.15);
      transform: translateY(-2px);
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .metric-icon {
      font-size: 1.5rem;
    }

    .metric-title {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .metric-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .metric-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Outfit', sans-serif;
    }

    .metric-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .metric-footer {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(123, 47, 214, 0.1);
    }

    .metric-success {
      border-left: 4px solid var(--status-green);
    }

    .metric-error {
      border-left: 4px solid var(--status-red);
    }

    .metric-warning {
      border-left: 4px solid var(--status-yellow);
    }

    .metric-info {
      border-left: 4px solid var(--accent-violet);
    }
  `]
})
export class MetricCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '—';
  @Input() label?: string;
  @Input() icon?: string;
  @Input() footer?: string;
  @Input() theme: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default';
}
