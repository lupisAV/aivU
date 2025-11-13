"""
Procesamiento y normalización de keypoints de pose
"""
import numpy as np
from typing import Optional, Tuple


class PoseProcessor:
    """
    Procesa y normaliza secuencias de keypoints para el modelo LSTM
    """
    
    def __init__(self):
        """Inicializa el procesador de pose"""
        # Estadísticas para normalización (se calculan del dataset de entrenamiento)
        self.mean: Optional[np.ndarray] = None
        self.std: Optional[np.ndarray] = None
        self.is_fitted = False
    
    def fit(self, sequences: np.ndarray) -> None:
        """
        Calcula estadísticas (media y desviación estándar) del dataset
        
        Args:
            sequences: Array de shape (num_samples, window_size, features)
                      Ejemplo: (1000, 30, 18)
        """
        # Calcular media y std a través de todas las muestras y frames
        # Resultado: shape (features,) -> (18,)
        self.mean = np.mean(sequences, axis=(0, 1))
        self.std = np.std(sequences, axis=(0, 1))
        
        # Evitar división por cero
        self.std = np.where(self.std == 0, 1.0, self.std)
        
        self.is_fitted = True
    
    def normalize(self, sequence: np.ndarray) -> np.ndarray:
        """
        Normaliza una secuencia usando Z-score normalization
        
        Args:
            sequence: Array de shape (window_size, features)
                     Ejemplo: (30, 18)
        
        Returns:
            Secuencia normalizada con la misma shape
        
        Raises:
            ValueError: Si el procesador no ha sido ajustado
        """
        if not self.is_fitted:
            # Si no está ajustado, usar normalización simple
            return self._normalize_simple(sequence)
        
        # Z-score normalization: (x - mean) / std
        normalized = (sequence - self.mean) / self.std
        return normalized.astype(np.float32)
    
    def _normalize_simple(self, sequence: np.ndarray) -> np.ndarray:
        """
        Normalización simple usando min-max por secuencia
        Útil para inferencia sin estadísticas pre-calculadas
        
        Args:
            sequence: Array de shape (window_size, features)
        
        Returns:
            Secuencia normalizada entre 0 y 1
        """
        # Min-Max normalization por feature
        min_vals = np.min(sequence, axis=0, keepdims=True)
        max_vals = np.max(sequence, axis=0, keepdims=True)
        
        # Evitar división por cero
        range_vals = max_vals - min_vals
        range_vals = np.where(range_vals == 0, 1.0, range_vals)
        
        normalized = (sequence - min_vals) / range_vals
        return normalized.astype(np.float32)
    
    def normalize_coordinates(self, sequence: np.ndarray) -> np.ndarray:
        """
        Normalización específica para coordenadas de pose
        Normaliza respecto al centro del cuerpo (promedio de hombros)
        
        Args:
            sequence: Array de shape (window_size, num_keypoints, 3)
                     Ejemplo: (30, 6, 3)
        
        Returns:
            Secuencia normalizada relativa al centro
        """
        # Calcular centro (promedio de hombros: keypoints 0 y 1)
        # Asumiendo que los primeros 2 keypoints son los hombros
        shoulders = sequence[:, :2, :]  # (30, 2, 3)
        center = np.mean(shoulders, axis=1, keepdims=True)  # (30, 1, 3)
        
        # Normalizar respecto al centro
        normalized = sequence - center
        
        # Escalar por la distancia entre hombros para invarianza de escala
        shoulder_distance = np.linalg.norm(
            sequence[:, 0, :] - sequence[:, 1, :],
            axis=1,
            keepdims=True
        )  # (30, 1)
        
        # Evitar división por cero
        shoulder_distance = np.where(
            shoulder_distance == 0,
            1.0,
            shoulder_distance
        )
        
        # Expandir dimensiones para broadcasting
        shoulder_distance = shoulder_distance[:, :, np.newaxis]  # (30, 1, 1)
        
        normalized = normalized / shoulder_distance
        
        return normalized.astype(np.float32)
    
    def denormalize(self, sequence: np.ndarray) -> np.ndarray:
        """
        Revierte la normalización Z-score
        
        Args:
            sequence: Secuencia normalizada
        
        Returns:
            Secuencia en escala original
        """
        if not self.is_fitted:
            raise ValueError("No se puede denormalizar sin estadísticas")
        
        denormalized = (sequence * self.std) + self.mean
        return denormalized.astype(np.float32)
    
    def get_stats(self) -> dict:
        """
        Obtiene las estadísticas de normalización
        
        Returns:
            Diccionario con mean y std
        """
        return {
            "is_fitted": self.is_fitted,
            "mean": self.mean.tolist() if self.mean is not None else None,
            "std": self.std.tolist() if self.std is not None else None
        }
    
    def save_stats(self, filepath: str) -> None:
        """
        Guarda las estadísticas de normalización
        
        Args:
            filepath: Ruta donde guardar las estadísticas (.npz)
        """
        if not self.is_fitted:
            raise ValueError("No hay estadísticas para guardar")
        
        np.savez(filepath, mean=self.mean, std=self.std)
    
    def load_stats(self, filepath: str) -> None:
        """
        Carga estadísticas de normalización desde archivo
        
        Args:
            filepath: Ruta del archivo .npz
        """
        data = np.load(filepath)
        self.mean = data['mean']
        self.std = data['std']
        self.is_fitted = True
