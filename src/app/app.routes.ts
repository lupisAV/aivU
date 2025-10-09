import { Routes } from '@angular/router';

export const routes: Routes = [
  
  { path: '', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },

  
  { path: 'signup', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },

  
  { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },

  
  { path: 'elbow-pose', loadComponent: () => import('./elbow-pose/elbow-pose').then(m => m.ElbowPoseComponent) },

  
  { path: '**', redirectTo: '' }
];
