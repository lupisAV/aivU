"""
Modelos de datos para ejercicios
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ExerciseData(BaseModel):
    """Datos de un ejercicio para guardar"""
    sequence: List[List[float]] = Field(..., description="Secuencia de keypoints (30, 18)")
    label: int = Field(..., description="Etiqueta: 0=incorrecto, 1=correcto")
    user_id: Optional[str] = Field(None, description="ID del usuario")
    exercise_type: str = Field(default="bicep_curl", description="Tipo de ejercicio")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    metadata: Optional[dict] = Field(default_factory=dict)


class ExerciseResponse(BaseModel):
    """Respuesta al guardar un ejercicio"""
    success: bool
    message: str
    exercise_id: Optional[str] = None
    saved_path: Optional[str] = None


class SessionData(BaseModel):
    """Datos de una sesión de entrenamiento"""
    session_id: str
    user_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    total_reps: int = 0
    correct_reps: int = 0
    incorrect_reps: int = 0
    average_confidence: float = 0.0
    exercises: List[dict] = Field(default_factory=list)


class SessionResponse(BaseModel):
    """Respuesta al guardar una sesión"""
    success: bool
    message: str
    session_id: str
    saved_path: Optional[str] = None


class DatasetStats(BaseModel):
    """Estadísticas del dataset recolectado"""
    total_exercises: int
    correct_exercises: int
    incorrect_exercises: int
    users: List[str]
    exercise_types: List[str]
    date_range: dict
