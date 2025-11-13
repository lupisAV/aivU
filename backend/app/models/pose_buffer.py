"""
Buffer para almacenar secuencias de keypoints de pose
"""
import numpy as np
from collections import deque
from typing import List, Optional
from app.config import settings


class PoseBuffer:
    """
    Buffer circular para almacenar keypoints de pose de los brazos.
    Mantiene una ventana deslizante de N frames.
    """
    
    def __init__(self, window_size: int = None):
        """
        Inicializa el buffer de pose
        
        Args:
            window_size: Número de frames a mantener en el buffer (default: 30)
        """
        self.window_size = window_size or settings.WINDOW_SIZE
        self.num_keypoints = len(settings.ARM_KEYPOINTS)
        self.coords = settings.KEYPOINT_COORDS
        
        # Buffer circular usando deque
        self.buffer = deque(maxlen=self.window_size)
        
        # Estadísticas
        self.total_frames_received = 0
    
    def add_frame(self, keypoints: List[List[float]]) -> None:
        """
        Añade un frame de keypoints al buffer
        
        Args:
            keypoints: Lista de keypoints [[x, y, z], [x, y, z], ...]
                      Debe contener exactamente 6 keypoints (brazos)
        
        Raises:
            ValueError: Si el formato de keypoints es inválido
        """
        if len(keypoints) != self.num_keypoints:
            raise ValueError(
                f"Se esperaban {self.num_keypoints} keypoints, "
                f"pero se recibieron {len(keypoints)}"
            )
        
        # Validar que cada keypoint tenga 3 coordenadas
        for i, kp in enumerate(keypoints):
            if len(kp) != self.coords:
                raise ValueError(
                    f"Keypoint {i} debe tener {self.coords} coordenadas, "
                    f"pero tiene {len(kp)}"
                )
        
        # Convertir a numpy array y añadir al buffer
        frame_array = np.array(keypoints, dtype=np.float32)
        self.buffer.append(frame_array)
        self.total_frames_received += 1
    
    def is_ready(self) -> bool:
        """
        Verifica si el buffer está lleno y listo para inferencia
        
        Returns:
            True si el buffer tiene exactamente window_size frames
        """
        return len(self.buffer) == self.window_size
    
    def get_sequence(self) -> Optional[np.ndarray]:
        """
        Obtiene la secuencia completa de frames como numpy array
        
        Returns:
            Array de shape (window_size, num_keypoints, coords) o None si no está listo
            Ejemplo: (30, 6, 3) para 30 frames, 6 keypoints, 3 coordenadas
        """
        if not self.is_ready():
            return None
        
        return np.array(self.buffer, dtype=np.float32)
    
    def get_flattened_sequence(self) -> Optional[np.ndarray]:
        """
        Obtiene la secuencia aplanada para el modelo LSTM
        
        Returns:
            Array de shape (window_size, num_keypoints * coords) o None
            Ejemplo: (30, 18) para 30 frames, 18 features
        """
        sequence = self.get_sequence()
        if sequence is None:
            return None
        
        # Aplanar las coordenadas: (30, 6, 3) -> (30, 18)
        return sequence.reshape(self.window_size, -1)
    
    def clear(self) -> None:
        """Limpia el buffer"""
        self.buffer.clear()
    
    def get_stats(self) -> dict:
        """
        Obtiene estadísticas del buffer
        
        Returns:
            Diccionario con estadísticas
        """
        return {
            "current_size": len(self.buffer),
            "window_size": self.window_size,
            "is_ready": self.is_ready(),
            "total_frames_received": self.total_frames_received,
            "fill_percentage": (len(self.buffer) / self.window_size) * 100
        }
    
    def __len__(self) -> int:
        """Retorna el número actual de frames en el buffer"""
        return len(self.buffer)
    
    def __repr__(self) -> str:
        return (
            f"PoseBuffer(size={len(self.buffer)}/{self.window_size}, "
            f"ready={self.is_ready()})"
        )
