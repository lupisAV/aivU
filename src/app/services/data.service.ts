import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExerciseData {
  sequence: number[][];
  label: number;
  user_id?: string;
  exercise_type?: string;
  metadata?: any;
}

export interface ExerciseResponse {
  success: boolean;
  message: string;
  exercise_id?: string;
  saved_path?: string;
}

export interface SessionData {
  session_id: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  total_reps: number;
  correct_reps: number;
  incorrect_reps: number;
  average_confidence: number;
  exercises: any[];
}

export interface SessionResponse {
  success: boolean;
  message: string;
  session_id: string;
  saved_path?: string;
}

export interface DatasetStats {
  total_exercises: number;
  correct_exercises: number;
  incorrect_exercises: number;
  users: string[];
  exercise_types: string[];
  date_range: {
    first: string | null;
    last: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly apiUrl = 'http://localhost:8000/api/data';

  constructor(private http: HttpClient) {}

  /**
   * Guarda un ejercicio
   */
  saveExercise(exercise: ExerciseData): Observable<ExerciseResponse> {
    return this.http.post<ExerciseResponse>(`${this.apiUrl}/exercise`, exercise);
  }

  /**
   * Guarda una sesión
   */
  saveSession(session: SessionData): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.apiUrl}/session`, session);
  }

  /**
   * Lista ejercicios
   */
  listExercises(params?: {
    user_id?: string;
    exercise_type?: string;
    label?: number;
    limit?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/exercises`, { params: params as any });
  }

  /**
   * Lista sesiones
   */
  listSessions(params?: {
    user_id?: string;
    limit?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions`, { params: params as any });
  }

  /**
   * Obtiene un ejercicio por ID
   */
  getExercise(exerciseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/exercise/${exerciseId}`);
  }

  /**
   * Obtiene una sesión por ID
   */
  getSession(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/session/${sessionId}`);
  }

  /**
   * Obtiene estadísticas del dataset
   */
  getDatasetStats(): Observable<DatasetStats> {
    return this.http.get<DatasetStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Exporta el dataset para entrenamiento
   */
  exportDataset(): Observable<any> {
    return this.http.post(`${this.apiUrl}/export-dataset`, {});
  }
}
