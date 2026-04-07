import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private isLoading$ = new BehaviorSubject<boolean>(false);
  private loadingMessage$ = new BehaviorSubject<string>('');

  getLoadingState(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  getLoadingMessage(): Observable<string> {
    return this.loadingMessage$.asObservable();
  }

  show(message = 'Cargando...') {
    this.loadingMessage$.next(message);
    this.isLoading$.next(true);
  }

  hide() {
    this.isLoading$.next(false);
    this.loadingMessage$.next('');
  }

  isLoadingNow(): boolean {
    return this.isLoading$.value;
  }
}
