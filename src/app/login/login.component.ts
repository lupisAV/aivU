import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeedbackService } from '../services/feedback.service';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(
    private router: Router,
    private feedbackService: FeedbackService,
    private loadingService: LoadingService
  ) {}

  goToHome() {
    this.loadingService.show('Iniciando sesión...');
    // Simular petición a servidor
    setTimeout(() => {
      this.loadingService.hide();
      this.feedbackService.success('¡Sesión iniciada correctamente!');
      this.router.navigate(['/home']);
    }, 1500);
  }

  goToRegister() {
    this.router.navigate(['/signup']);
  }
}
