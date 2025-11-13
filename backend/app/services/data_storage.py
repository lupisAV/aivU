"""
Servicio para almacenar ejercicios y sesiones
"""
import numpy as np
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class DataStorageService:
    """
    Servicio para almacenar y gestionar datos de ejercicios
    """
    
    def __init__(self, base_path: str = "data"):
        """
        Inicializa el servicio de almacenamiento
        
        Args:
            base_path: Ruta base para almacenar datos
        """
        self.base_path = Path(base_path)
        self.exercises_path = self.base_path / "exercises"
        self.sessions_path = self.base_path / "sessions"
        self.dataset_path = self.base_path / "dataset"
        
        # Crear directorios si no existen
        self.exercises_path.mkdir(parents=True, exist_ok=True)
        self.sessions_path.mkdir(parents=True, exist_ok=True)
        self.dataset_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"DataStorageService inicializado en: {self.base_path}")
    
    def save_exercise(
        self,
        sequence: np.ndarray,
        label: int,
        user_id: Optional[str] = None,
        exercise_type: str = "bicep_curl",
        metadata: Optional[Dict] = None
    ) -> Tuple[bool, str, str]:
        """
        Guarda un ejercicio individual
        
        Args:
            sequence: Secuencia de keypoints (30, 18)
            label: 0=incorrecto, 1=correcto
            user_id: ID del usuario
            exercise_type: Tipo de ejercicio
            metadata: Metadatos adicionales
        
        Returns:
            (success, message, exercise_id)
        """
        try:
            # Validar secuencia
            if sequence.shape != (30, 18):
                return False, f"Shape inválido: {sequence.shape}, esperado (30, 18)", ""
            
            # Generar ID único
            timestamp = datetime.now()
            exercise_id = f"{exercise_type}_{timestamp.strftime('%Y%m%d_%H%M%S_%f')}"
            
            # Preparar metadatos (sin sequence para evitar duplicación)
            metadata_dict = {
                'exercise_id': exercise_id,
                'label': label,
                'label_name': 'correcto' if label == 1 else 'incorrecto',
                'user_id': user_id or 'anonymous',
                'exercise_type': exercise_type,
                'timestamp': timestamp.isoformat(),
                'metadata': metadata or {}
            }
            
            # Guardar en formato .npz (numpy comprimido)
            npz_path = self.exercises_path / f"{exercise_id}.npz"
            np.savez_compressed(
                npz_path,
                sequence=sequence,
                label=np.array([label])
            )
            
            # Preparar datos completos para JSON (con sequence como lista)
            exercise_data = {
                **metadata_dict,
                'sequence': sequence.tolist()
            }
            
            # Guardar metadatos en JSON
            json_path = self.exercises_path / f"{exercise_id}.json"
            with open(json_path, 'w') as f:
                json.dump(exercise_data, f, indent=2)
            
            logger.info(f"Ejercicio guardado: {exercise_id}")
            return True, "Ejercicio guardado exitosamente", exercise_id
        
        except Exception as e:
            logger.error(f"Error al guardar ejercicio: {str(e)}")
            return False, f"Error: {str(e)}", ""
    
    def save_session(
        self,
        session_id: str,
        session_data: Dict
    ) -> Tuple[bool, str, str]:
        """
        Guarda una sesión de entrenamiento
        
        Args:
            session_id: ID de la sesión
            session_data: Datos de la sesión
        
        Returns:
            (success, message, saved_path)
        """
        try:
            # Convertir datetime a string si es necesario
            def convert_datetime(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: convert_datetime(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_datetime(item) for item in obj]
                return obj
            
            # Convertir todos los datetime a string
            session_data_clean = convert_datetime(session_data)
            
            # Agregar timestamp si no existe
            if 'timestamp' not in session_data_clean:
                session_data_clean['timestamp'] = datetime.now().isoformat()
            
            # Guardar en JSON
            session_path = self.sessions_path / f"{session_id}.json"
            with open(session_path, 'w') as f:
                json.dump(session_data_clean, f, indent=2)
            
            logger.info(f"Sesión guardada: {session_id}")
            return True, "Sesión guardada exitosamente", str(session_path)
        
        except Exception as e:
            logger.error(f"Error al guardar sesión: {str(e)}")
            return False, f"Error: {str(e)}", ""
    
    def load_exercise(self, exercise_id: str) -> Optional[Dict]:
        """
        Carga un ejercicio por ID
        
        Args:
            exercise_id: ID del ejercicio
        
        Returns:
            Diccionario con datos del ejercicio o None
        """
        try:
            json_path = self.exercises_path / f"{exercise_id}.json"
            if not json_path.exists():
                return None
            
            with open(json_path, 'r') as f:
                return json.load(f)
        
        except Exception as e:
            logger.error(f"Error al cargar ejercicio {exercise_id}: {str(e)}")
            return None
    
    def load_session(self, session_id: str) -> Optional[Dict]:
        """
        Carga una sesión por ID
        
        Args:
            session_id: ID de la sesión
        
        Returns:
            Diccionario con datos de la sesión o None
        """
        try:
            session_path = self.sessions_path / f"{session_id}.json"
            if not session_path.exists():
                return None
            
            with open(session_path, 'r') as f:
                return json.load(f)
        
        except Exception as e:
            logger.error(f"Error al cargar sesión {session_id}: {str(e)}")
            return None
    
    def list_exercises(
        self,
        user_id: Optional[str] = None,
        exercise_type: Optional[str] = None,
        label: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Lista ejercicios con filtros opcionales
        
        Args:
            user_id: Filtrar por usuario
            exercise_type: Filtrar por tipo
            label: Filtrar por etiqueta
            limit: Número máximo de resultados
        
        Returns:
            Lista de ejercicios
        """
        exercises = []
        
        try:
            json_files = sorted(
                self.exercises_path.glob("*.json"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            for json_file in json_files[:limit]:
                with open(json_file, 'r') as f:
                    exercise = json.load(f)
                
                # Aplicar filtros
                if user_id and exercise.get('user_id') != user_id:
                    continue
                if exercise_type and exercise.get('exercise_type') != exercise_type:
                    continue
                if label is not None and exercise.get('label') != label:
                    continue
                
                # No incluir la secuencia completa en el listado
                exercise_summary = {k: v for k, v in exercise.items() if k != 'sequence'}
                exercises.append(exercise_summary)
        
        except Exception as e:
            logger.error(f"Error al listar ejercicios: {str(e)}")
        
        return exercises
    
    def list_sessions(
        self,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Lista sesiones con filtros opcionales
        
        Args:
            user_id: Filtrar por usuario
            limit: Número máximo de resultados
        
        Returns:
            Lista de sesiones
        """
        sessions = []
        
        try:
            json_files = sorted(
                self.sessions_path.glob("*.json"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            for json_file in json_files[:limit]:
                with open(json_file, 'r') as f:
                    session = json.load(f)
                
                # Aplicar filtros
                if user_id and session.get('user_id') != user_id:
                    continue
                
                sessions.append(session)
        
        except Exception as e:
            logger.error(f"Error al listar sesiones: {str(e)}")
        
        return sessions
    
    def get_dataset_stats(self) -> Dict:
        """
        Obtiene estadísticas del dataset recolectado
        
        Returns:
            Diccionario con estadísticas
        """
        try:
            exercises = self.list_exercises(limit=10000)
            
            stats = {
                'total_exercises': len(exercises),
                'correct_exercises': sum(1 for e in exercises if e.get('label') == 1),
                'incorrect_exercises': sum(1 for e in exercises if e.get('label') == 0),
                'users': list(set(e.get('user_id', 'anonymous') for e in exercises)),
                'exercise_types': list(set(e.get('exercise_type', 'unknown') for e in exercises)),
                'date_range': {
                    'first': min((e.get('timestamp') for e in exercises), default=None),
                    'last': max((e.get('timestamp') for e in exercises), default=None)
                }
            }
            
            return stats
        
        except Exception as e:
            logger.error(f"Error al obtener estadísticas: {str(e)}")
            return {
                'total_exercises': 0,
                'correct_exercises': 0,
                'incorrect_exercises': 0,
                'users': [],
                'exercise_types': [],
                'date_range': {'first': None, 'last': None}
            }
    
    def export_dataset_for_training(
        self,
        output_path: Optional[str] = None
    ) -> Tuple[bool, str, Dict]:
        """
        Exporta el dataset completo para entrenamiento
        
        Args:
            output_path: Ruta de salida (opcional)
        
        Returns:
            (success, message, info)
        """
        try:
            # Cargar todos los ejercicios
            npz_files = list(self.exercises_path.glob("*.npz"))
            
            if not npz_files:
                return False, "No hay ejercicios para exportar", {}
            
            sequences = []
            labels = []
            
            for npz_file in npz_files:
                data = np.load(npz_file)
                sequences.append(data['sequence'])
                labels.append(data['label'][0])
            
            sequences = np.array(sequences)
            labels = np.array(labels)
            
            # Guardar dataset
            if output_path is None:
                output_path = self.dataset_path / f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.npz"
            
            np.savez_compressed(
                output_path,
                sequences=sequences,
                labels=labels
            )
            
            info = {
                'total_samples': len(sequences),
                'shape': sequences.shape,
                'class_distribution': {
                    'incorrect': int(np.sum(labels == 0)),
                    'correct': int(np.sum(labels == 1))
                },
                'output_path': str(output_path)
            }
            
            logger.info(f"Dataset exportado: {output_path}")
            return True, "Dataset exportado exitosamente", info
        
        except Exception as e:
            logger.error(f"Error al exportar dataset: {str(e)}")
            return False, f"Error: {str(e)}", {}


# Instancia global del servicio
_data_storage_service: Optional[DataStorageService] = None


def get_data_storage_service() -> DataStorageService:
    """
    Obtiene la instancia global del servicio de almacenamiento
    
    Returns:
        Instancia de DataStorageService
    """
    global _data_storage_service
    
    if _data_storage_service is None:
        _data_storage_service = DataStorageService()
    
    return _data_storage_service
