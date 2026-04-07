import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FeedbackService } from '../services/feedback.service';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  constructor(
    private router: Router,
    private feedbackService: FeedbackService,
    private loadingService: LoadingService
  ) {}

  goToHome() {
    this.loadingService.show('Creando cuenta...');
    // Simular petición a servidor
    setTimeout(() => {
      this.loadingService.hide();
      this.feedbackService.success('¡Cuenta creada correctamente!');
      this.router.navigate(['/home']);
    }, 1500);
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}
