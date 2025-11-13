"""
Rutas para gestión de datos (ejercicios y sesiones)
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional, List
import numpy as np
import logging

from app.models.exercise import (
    ExerciseData,
    ExerciseResponse,
    SessionData,
    SessionResponse,
    DatasetStats
)
from app.services.data_storage import get_data_storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data", tags=["data"])


@router.post("/exercise", response_model=ExerciseResponse)
async def save_exercise(exercise: ExerciseData):
    """
    Guarda un ejercicio individual
    
    Args:
        exercise: Datos del ejercicio
    
    Returns:
        Respuesta con resultado de la operación
    """
    try:
        storage = get_data_storage_service()
        
        # Convertir secuencia a numpy array
        sequence = np.array(exercise.sequence, dtype=np.float32)
        
        # Validar shape
        if sequence.shape != (30, 18):
            raise HTTPException(
                status_code=400,
                detail=f"Shape inválido: {sequence.shape}, esperado (30, 18)"
            )
        
        # Guardar ejercicio
        success, message, exercise_id = storage.save_exercise(
            sequence=sequence,
            label=exercise.label,
            user_id=exercise.user_id,
            exercise_type=exercise.exercise_type,
            metadata=exercise.metadata
        )
        
        if not success:
            raise HTTPException(status_code=500, detail=message)
        
        return ExerciseResponse(
            success=True,
            message=message,
            exercise_id=exercise_id,
            saved_path=f"data/exercises/{exercise_id}.npz"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al guardar ejercicio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session", response_model=SessionResponse)
async def save_session(session: SessionData):
    """
    Guarda una sesión de entrenamiento
    
    Args:
        session: Datos de la sesión
    
    Returns:
        Respuesta con resultado de la operación
    """
    try:
        storage = get_data_storage_service()
        
        # Convertir a diccionario
        session_dict = session.model_dump()
        
        # Guardar sesión
        success, message, saved_path = storage.save_session(
            session_id=session.session_id,
            session_data=session_dict
        )
        
        if not success:
            raise HTTPException(status_code=500, detail=message)
        
        return SessionResponse(
            success=True,
            message=message,
            session_id=session.session_id,
            saved_path=saved_path
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al guardar sesión: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exercises")
async def list_exercises(
    user_id: Optional[str] = None,
    exercise_type: Optional[str] = None,
    label: Optional[int] = None,
    limit: int = 100
):
    """
    Lista ejercicios con filtros opcionales
    
    Args:
        user_id: Filtrar por usuario
        exercise_type: Filtrar por tipo
        label: Filtrar por etiqueta (0 o 1)
        limit: Número máximo de resultados
    
    Returns:
        Lista de ejercicios
    """
    try:
        storage = get_data_storage_service()
        exercises = storage.list_exercises(
            user_id=user_id,
            exercise_type=exercise_type,
            label=label,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(exercises),
            "exercises": exercises
        }
    
    except Exception as e:
        logger.error(f"Error al listar ejercicios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def list_sessions(
    user_id: Optional[str] = None,
    limit: int = 50
):
    """
    Lista sesiones con filtros opcionales
    
    Args:
        user_id: Filtrar por usuario
        limit: Número máximo de resultados
    
    Returns:
        Lista de sesiones
    """
    try:
        storage = get_data_storage_service()
        sessions = storage.list_sessions(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(sessions),
            "sessions": sessions
        }
    
    except Exception as e:
        logger.error(f"Error al listar sesiones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exercise/{exercise_id}")
async def get_exercise(exercise_id: str):
    """
    Obtiene un ejercicio por ID
    
    Args:
        exercise_id: ID del ejercicio
    
    Returns:
        Datos del ejercicio
    """
    try:
        storage = get_data_storage_service()
        exercise = storage.load_exercise(exercise_id)
        
        if exercise is None:
            raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
        
        return {
            "success": True,
            "exercise": exercise
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener ejercicio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Obtiene una sesión por ID
    
    Args:
        session_id: ID de la sesión
    
    Returns:
        Datos de la sesión
    """
    try:
        storage = get_data_storage_service()
        session = storage.load_session(session_id)
        
        if session is None:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        return {
            "success": True,
            "session": session
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener sesión: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=DatasetStats)
async def get_dataset_stats():
    """
    Obtiene estadísticas del dataset recolectado
    
    Returns:
        Estadísticas del dataset
    """
    try:
        storage = get_data_storage_service()
        stats = storage.get_dataset_stats()
        
        return DatasetStats(**stats)
    
    except Exception as e:
        logger.error(f"Error al obtener estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-dataset")
async def export_dataset():
    """
    Exporta el dataset completo para entrenamiento
    
    Returns:
        Información del dataset exportado
    """
    try:
        storage = get_data_storage_service()
        success, message, info = storage.export_dataset_for_training()
        
        if not success:
            raise HTTPException(status_code=500, detail=message)
        
        return {
            "success": True,
            "message": message,
            "info": info
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al exportar dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
