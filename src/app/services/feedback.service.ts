import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  
  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  success(message: string, duration = 3000) {
    this.addToast(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.addToast(message, 'error', duration);
  }

  info(message: string, duration = 3000) {
    this.addToast(message, 'info', duration);
  }

  warning(message: string, duration = 4000) {
    this.addToast(message, 'warning', duration);
  }

  private addToast(message: string, type: Toast['type'], duration: number) {
    const id = `toast-${Date.now()}`;
    const toast: Toast = { id, message, type, duration };
    
    const current = this.toasts$.value;
    this.toasts$.next([...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  removeToast(id: string) {
    const current = this.toasts$.value;
    this.toasts$.next(current.filter(t => t.id !== id));
  }

  clearAll() {
    this.toasts$.next([]);
  }
}
