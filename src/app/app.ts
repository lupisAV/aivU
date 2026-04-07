import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { GlobalLoaderComponent } from './components/global-loader/global-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    ToastContainerComponent,
    GlobalLoaderComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AivU');
  showNavbar = signal(true);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Ocultar navbar en login y registro
      const hideNavbarRoutes = ['/', '/signup'];
      this.showNavbar.set(!hideNavbarRoutes.includes(event.urlAfterRedirects));
    });
  }
}
