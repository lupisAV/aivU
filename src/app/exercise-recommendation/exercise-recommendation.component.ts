import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

interface Exercise {
  name: string;
  description: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  impact: 'low' | 'medium' | 'high';
  contraindications: string[];
  benefits: string[];
}

interface UserProfile {
  weight: number;
  height: number;
  age: number;
  physicalLimitations: string[];
  customLimitations: string;
}

interface ExerciseRecommendation {
  exercise: Exercise;
  category: 'recommended' | 'caution' | 'not-recommended';
  reason: string;
}

@Component({
  selector: 'app-exercise-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exercise-recommendation.component.html',
  styleUrls: ['./exercise-recommendation.component.css']
})
export class ExerciseRecommendationComponent {
  userProfile: UserProfile = {
    weight: 0,
    height: 0,
    age: 0,
    physicalLimitations: [],
    customLimitations: ''
  };

  showModal = false;
  currentRecIndex = 0;
  activeRecommendations: ExerciseRecommendation[] = [];

  availableLimitations = [
    'Dolor de rodilla',
    'Dolor de espalda baja',
    'Lesión de hombro',
    'Problemas cervicales',
    'Artritis',
    'Hipertensión',
    'Problemas cardíacos',
    'Escoliosis',
    'Hernias discales',
    'Lesión de muñeca',
    'Problemas de cadera',
    'Osteoporosis'
  ];

  exercises: Exercise[] = [
    {
      name: 'Sentadillas',
      description: 'Ejercicio fundamental para fortalecer piernas y glúteos',
      muscleGroups: ['Cuádriceps', 'Glúteos', 'Core'],
      difficulty: 'beginner',
      impact: 'medium',
      contraindications: ['Dolor de rodilla', 'Problemas de cadera', 'Lesión de espalda baja'],
      benefits: ['Fortalece piernas', 'Mejora equilibrio', 'Aumenta masa muscular']
    },
    {
      name: 'Flexiones de Pecho',
      description: 'Ejercicio clásico para pecho, hombros y tríceps',
      muscleGroups: ['Pecho', 'Hombros', 'Tríceps'],
      difficulty: 'beginner',
      impact: 'low',
      contraindications: ['Lesión de hombro', 'Lesión de muñeca', 'Problemas cervicales'],
      benefits: ['Fortalece tren superior', 'Mejora postura', 'Aumenta resistencia']
    },
    {
      name: 'Plancha',
      description: 'Ejercicio isométrico para fortalecer el core',
      muscleGroups: ['Core', 'Hombros', 'Espalda'],
      difficulty: 'beginner',
      impact: 'low',
      contraindications: ['Lesión de hombro', 'Dolor de espalda baja', 'Hipertensión'],
      benefits: ['Fortalece abdomen', 'Mejora estabilidad', 'Previene lesiones']
    },
    {
      name: 'Peso Muerto',
      description: 'Ejercicio compuesto para espalda y piernas',
      muscleGroups: ['Espalda', 'Glúteos', 'Isquiotibiales'],
      difficulty: 'advanced',
      impact: 'high',
      contraindications: ['Dolor de espalda baja', 'Hernias discales', 'Problemas de cadera'],
      benefits: ['Fortalece espalda', 'Aumenta fuerza general', 'Mejora postura']
    },
    {
      name: 'Press de Hombros',
      description: 'Ejercicio para desarrollar hombros y tríceps',
      muscleGroups: ['Hombros', 'Tríceps', 'Core'],
      difficulty: 'intermediate',
      impact: 'medium',
      contraindications: ['Lesión de hombro', 'Problemas cervicales', 'Hipertensión'],
      benefits: ['Fortalece hombros', 'Mejora movilidad', 'Aumenta masa muscular']
    },
    {
      name: 'Zancadas',
      description: 'Ejercicio unilateral para piernas y equilibrio',
      muscleGroups: ['Cuádriceps', 'Glúteos', 'Core'],
      difficulty: 'intermediate',
      impact: 'medium',
      contraindications: ['Dolor de rodilla', 'Problemas de cadera', 'Problemas de equilibrio'],
      benefits: ['Mejora equilibrio', 'Fortalece piernas', 'Corrige asimetrías']
    },
    {
      name: 'Remo con Barra',
      description: 'Ejercicio para espalda media y bíceps',
      muscleGroups: ['Espalda', 'Bíceps', 'Core'],
      difficulty: 'intermediate',
      impact: 'medium',
      contraindications: ['Dolor de espalda baja', 'Lesión de hombro', 'Hernias discales'],
      benefits: ['Fortalece espalda', 'Mejora postura', 'Aumenta masa muscular']
    },
    {
      name: 'Burpees',
      description: 'Ejercicio cardiovascular de cuerpo completo',
      muscleGroups: ['Todo el cuerpo'],
      difficulty: 'advanced',
      impact: 'high',
      contraindications: ['Problemas cardíacos', 'Dolor de rodilla', 'Lesión de hombro', 'Hipertensión'],
      benefits: ['Quema calorías', 'Mejora resistencia', 'Fortalece todo el cuerpo']
    },
    {
      name: 'Caminata',
      description: 'Ejercicio cardiovascular de bajo impacto',
      muscleGroups: ['Piernas', 'Core'],
      difficulty: 'beginner',
      impact: 'low',
      contraindications: [],
      benefits: ['Mejora salud cardiovascular', 'Bajo impacto', 'Accesible para todos']
    },
    {
      name: 'Natación',
      description: 'Ejercicio de cuerpo completo sin impacto',
      muscleGroups: ['Todo el cuerpo'],
      difficulty: 'beginner',
      impact: 'low',
      contraindications: ['Problemas cervicales graves'],
      benefits: ['Cero impacto articular', 'Fortalece todo el cuerpo', 'Mejora capacidad pulmonar']
    },
    {
      name: 'Yoga',
      description: 'Práctica de flexibilidad y equilibrio',
      muscleGroups: ['Todo el cuerpo'],
      difficulty: 'beginner',
      impact: 'low',
      contraindications: ['Osteoporosis severa', 'Hernias discales agudas'],
      benefits: ['Mejora flexibilidad', 'Reduce estrés', 'Mejora equilibrio']
    },
    {
      name: 'Dominadas',
      description: 'Ejercicio de tracción para espalda y bíceps',
      muscleGroups: ['Espalda', 'Bíceps', 'Core'],
      difficulty: 'advanced',
      impact: 'medium',
      contraindications: ['Lesión de hombro', 'Lesión de muñeca', 'Problemas cervicales'],
      benefits: ['Fortalece espalda', 'Aumenta fuerza de agarre', 'Mejora postura']
    }
  ];

  recommendations: ExerciseRecommendation[] = [];
  bmi = 0;
  bmiCategory = '';

  toggleLimitation(limitation: string) {
    const index = this.userProfile.physicalLimitations.indexOf(limitation);
    if (index > -1) {
      this.userProfile.physicalLimitations.splice(index, 1);
    } else {
      this.userProfile.physicalLimitations.push(limitation);
    }
  }

  isLimitationSelected(limitation: string): boolean {
    return this.userProfile.physicalLimitations.includes(limitation);
  }

  calculateBMI() {
    const heightInMeters = this.userProfile.height / 100;
    this.bmi = this.userProfile.weight / (heightInMeters * heightInMeters);
    
    if (this.bmi < 18.5) {
      this.bmiCategory = 'Bajo peso';
    } else if (this.bmi < 25) {
      this.bmiCategory = 'Peso normal';
    } else if (this.bmi < 30) {
      this.bmiCategory = 'Sobrepeso';
    } else {
      this.bmiCategory = 'Obesidad';
    }
  }

  generateRecommendations() {
    if (!this.validateForm()) {
      alert('Por favor completa todos los campos requeridos (peso, altura y edad)');
      return;
    }

    this.calculateBMI();
    this.recommendations = [];

    const allLimitations = [
      ...this.userProfile.physicalLimitations,
      ...(this.userProfile.customLimitations ? [this.userProfile.customLimitations] : [])
    ];

    this.exercises.forEach(exercise => {
      const recommendation = this.evaluateExercise(exercise, allLimitations);
      this.recommendations.push(recommendation);
    });

    // Ordenar por categoría
    this.recommendations.sort((a, b) => {
      const order = { 'recommended': 0, 'caution': 1, 'not-recommended': 2 };
      return order[a.category] - order[b.category];
    });

    this.activeRecommendations = this.recommendations.filter(r => r.category !== 'not-recommended');
    if (this.activeRecommendations.length === 0) {
      // Si no hay recomendadas o precaución, mostrar las no recomendadas para feedback
      this.activeRecommendations = this.recommendations;
    }
    
    this.currentRecIndex = 0;
    this.showModal = true;
    
    // Animaciones GSAP para el modal flotante
    setTimeout(() => {
      gsap.fromTo('.recommendations-modal', 
        { y: 50, opacity: 0, scale: 0.9 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
      );
    }, 10);
  }

  nextExercise() {
    if (this.currentRecIndex < this.activeRecommendations.length - 1) {
      this.animateSlide(-30, () => {
        this.currentRecIndex++;
      });
    }
  }

  prevExercise() {
    if (this.currentRecIndex > 0) {
      this.animateSlide(30, () => {
        this.currentRecIndex--;
      });
    }
  }

  animateSlide(xOffset: number, callback: () => void) {
    gsap.to('.modal-body-content', {
      x: xOffset, opacity: 0, duration: 0.2,
      onComplete: () => {
        callback();
        gsap.fromTo('.modal-body-content', 
          { x: -xOffset, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.3 }
        );
      }
    });
  }

  closeRecommendationModal() {
    gsap.to('.recommendations-modal', {
      y: 50, opacity: 0, scale: 0.9, duration: 0.3, ease: 'power3.in',
      onComplete: () => {
        this.showModal = false;
        this.activeRecommendations = [];
      }
    });
  }

  evaluateExercise(exercise: Exercise, limitations: string[]): ExerciseRecommendation {
    const hasContraindication = exercise.contraindications.some(contra =>
      limitations.some(limit => limit.toLowerCase().includes(contra.toLowerCase()))
    );

    // Factores de edad
    const isElderly = this.userProfile.age > 65;
    const isYoung = this.userProfile.age < 18;

    // Factores de peso
    const isOverweight = this.bmi > 25;
    const isObese = this.bmi > 30;

    if (hasContraindication) {
      return {
        exercise,
        category: 'not-recommended',
        reason: `Este ejercicio está contraindicado debido a: ${exercise.contraindications.filter(c => 
          limitations.some(l => l.toLowerCase().includes(c.toLowerCase()))
        ).join(', ')}`
      };
    }

    // Ejercicios de alto impacto para personas mayores u obesas
    if ((isElderly || isObese) && exercise.impact === 'high') {
      return {
        exercise,
        category: 'caution',
        reason: isElderly 
          ? 'Ejercicio de alto impacto. Se recomienda supervisión profesional debido a la edad.'
          : 'Ejercicio de alto impacto. Se recomienda precaución debido al IMC elevado.'
      };
    }

    // Ejercicios avanzados para principiantes
    if (exercise.difficulty === 'advanced' && (isElderly || isYoung || limitations.length > 2)) {
      return {
        exercise,
        category: 'caution',
        reason: 'Ejercicio avanzado. Se recomienda comenzar con variaciones más simples y supervisión.'
      };
    }

    // Ejercicios de bajo impacto son ideales para personas con limitaciones
    if (exercise.impact === 'low' && limitations.length > 0) {
      return {
        exercise,
        category: 'recommended',
        reason: 'Ejercicio de bajo impacto, ideal para tu perfil. ' + exercise.benefits.slice(0, 2).join('. ')
      };
    }

    // Ejercicios para principiantes son buenos para todos
    if (exercise.difficulty === 'beginner') {
      return {
        exercise,
        category: 'recommended',
        reason: 'Ejercicio apropiado para tu nivel. ' + exercise.benefits.slice(0, 2).join('. ')
      };
    }

    // Ejercicios intermedios
    if (exercise.difficulty === 'intermediate' && !isElderly && !isObese) {
      return {
        exercise,
        category: 'recommended',
        reason: 'Ejercicio adecuado para tu perfil. ' + exercise.benefits.slice(0, 2).join('. ')
      };
    }

    return {
      exercise,
      category: 'caution',
      reason: 'Ejercicio que puedes realizar con precaución. Se recomienda supervisión inicial.'
    };
  }

  validateForm(): boolean {
    return this.userProfile.weight > 0 && 
           this.userProfile.height > 0 && 
           this.userProfile.age > 0;
  }

  resetForm() {
    this.userProfile = {
      weight: 0,
      height: 0,
      age: 0,
      physicalLimitations: [],
      customLimitations: ''
    };
    this.showModal = false;
    this.recommendations = [];
    this.activeRecommendations = [];
  }
}
