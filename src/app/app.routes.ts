import { Routes } from '@angular/router';

export const routes: Routes = [
  
  { path: '', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },

  
  { path: 'signup', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },

  
  { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },

  
  { path: 'elbow-pose', loadComponent: () => import('./components/exercise-camera/exercise-camera.component').then(m => m.ExerciseCameraComponent) },

  
  { path: 'exercise-recommendation', loadComponent: () => import('./exercise-recommendation/exercise-recommendation.component').then(m => m.ExerciseRecommendationComponent) },

  
  { path: 'comparison', loadComponent: () => import('./components/comparison/comparison.component').then(m => m.ComparisonComponent) },

  
  { path: '**', redirectTo: '' }
];
